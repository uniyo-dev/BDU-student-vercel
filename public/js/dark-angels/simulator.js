// Dark Angels — Placement Simulation Engine (v3.1 - clone-merge)
// Pure logic. No DOM. No fetch. No globals except the export.

(function (root) {
  'use strict';

  function toNumber(v) {
    if (v === null || v === undefined || v === '') return null;
    if (typeof v === 'number') return isFinite(v) ? v : null;
    var n = parseFloat(String(v).replace('%', '').trim());
    return isFinite(n) ? n : null;
  }

  var MAX_PICKS_PER_STUDENT = 8;
  var FEMALE_QUOTA = 0.20;

  // ─── Group anonymized rows into candidates by (score|gender) ───
  function groupByStudent(allStudents) {
    var bySig = {};

    (allStudents || []).forEach(function (row) {
      if (!row) return;
      var nScore = parseFloat(String(row.totalScore || '').replace('%', '').trim());
      if (!isFinite(nScore)) return;
      var scoreKey = nScore.toFixed(3);

      var rawGender = (row.gender || '').trim().toUpperCase();
      var gender = (rawGender === 'M' || rawGender === 'MALE') ? 'M'
                 : (rawGender === 'F' || rawGender === 'FEMALE') ? 'F'
                 : 'U';
      var sig = scoreKey + '|' + gender;

      var dept = String(row.department || '').trim();
      if (!dept) return;

      var prio = parseInt(row.priority, 10);
      if (isNaN(prio)) prio = 9999;

      if (!bySig[sig]) {
        bySig[sig] = { score: nScore, gender: gender, rows: [] };
      }
      bySig[sig].rows.push({ department: dept, priority: prio });
    });

    var out = {};
    Object.keys(bySig).forEach(function (sig) {
      var bucket = bySig[sig];
      var N = bucket.rows.length;
      var numCandidates = Math.max(1, Math.ceil(N / MAX_PICKS_PER_STUDENT));

      var candidates = [];
      for (var c = 0; c < numCandidates; c++) {
        candidates.push({
          studentId: sig + '#' + c,
          score: bucket.score,
          gender: bucket.gender,
          choices: []
        });
      }

      bucket.rows.forEach(function (pick, i) {
        candidates[i % numCandidates].choices.push(pick);
      });

      candidates.forEach(function (cand) {
        cand.choices.sort(function (a, b) { return a.priority - b.priority; });
        if (cand.choices.length > 0) {
          out[cand.studentId] = cand;
        }
      });
    });

    return out;
  }

  function buildCapacity(selectionOptions) {
    var caps = {};
    (selectionOptions || []).forEach(function (o) {
      if (!o || !o.department) return;
      var name = String(o.department).trim();
      if (!name) return;
      var c = toNumber(o.capacity);
      caps[name] = c === null ? 0 : Math.max(0, Math.floor(c));
    });
    return caps;
  }

  function simulate(opts) {
    opts = opts || {};
    var applyQuota = !!opts.applyFemaleQuota;
    var myId = String(opts.myStudentId || '').trim().toUpperCase();

    var students = groupByStudent(opts.allStudents);
    var seatsLeft = buildCapacity(opts.selectionOptions);
    var capacitySnapshot = {};
    Object.keys(seatsLeft).forEach(function (k) { capacitySnapshot[k] = seatsLeft[k]; });

    // ─── Parse the user's own score + gender ───
    var myScore = null;
    var myGender = 'U';
    (opts.myResults || []).forEach(function (r) {
      if (myScore === null && r && r.totalScore != null) myScore = toNumber(r.totalScore);
    });
    if (opts.myResults && opts.myResults.length > 0) {
      var rawGen = String(opts.myResults[0].gender || '').trim().toUpperCase();
      myGender = (rawGen === 'M' || rawGen === 'MALE') ? 'M'
               : (rawGen === 'F' || rawGen === 'FEMALE') ? 'F'
               : 'U';
    }

    // ─── CLONE-MERGE: collect ALL clones matching (score|gender) ───
    if (myScore !== null && myId) {
      var sigPrefix = myScore.toFixed(3) + '|' + myGender;
      var cloneKeys = [];
      for (var k in students) {
        if (k.indexOf(sigPrefix) === 0) cloneKeys.push(k);
      }
      if (cloneKeys.length > 0) {
        var mergedChoices = [];
        cloneKeys.forEach(function (k) {
          students[k].choices.forEach(function (c) { mergedChoices.push(c); });
          delete students[k];
        });
        // Dedupe (dept|priority)
        var seen = {};
        var unique = [];
        mergedChoices.forEach(function (c) {
          var kk = c.department + '|' + c.priority;
          if (seen[kk]) return;
          seen[kk] = 1;
          unique.push(c);
        });
        unique.sort(function (a, b) { return a.priority - b.priority; });
        students[myId] = {
          studentId: myId,
          score: myScore,
          gender: myGender,
          choices: unique
        };
      }
    }

    // Fallback if still missing
    if (myId && !students[myId]) {
      var rec = { studentId: myId, score: myScore, gender: myGender, choices: [] };
      (opts.myResults || []).forEach(function (r) {
        if (!r || !r.department) return;
        var p = toNumber(r.priority);
        rec.choices.push({ department: String(r.department).trim(), priority: p === null ? 9999 : p });
      });
      rec.choices.sort(function (a, b) { return a.priority - b.priority; });
      students[myId] = rec;
    }

    // ─── Reserved female pools (soft target) ───
    var reservedLeft = {};
    if (applyQuota) {
      Object.keys(capacitySnapshot).forEach(function (dept) {
        reservedLeft[dept] = Math.floor(capacitySnapshot[dept] * FEMALE_QUOTA);
        seatsLeft[dept] = capacitySnapshot[dept] - reservedLeft[dept];
      });
    }

    // ─── Order by score desc, tie-break by id asc ───
    var ordered = Object.keys(students).map(function (k) { return students[k]; });
    ordered.sort(function (a, b) {
      var as = a.score === null ? -Infinity : a.score;
      var bs = b.score === null ? -Infinity : b.score;
      if (bs !== as) return bs - as;
      return a.studentId < b.studentId ? -1 : (a.studentId > b.studentId ? 1 : 0);
    });

    var assignment = {};
    var cutoffByDept = {};
    var filledByDept = {};

    function tryAssign(s, allowGeneral, allowReserved) {
      for (var i = 0; i < s.choices.length; i++) {
        var c = s.choices[i];
        var dept = c.department;
        if (typeof seatsLeft[dept] === 'undefined') continue;
        var isFemale = String(s.gender || '').toUpperCase() === 'F';
        var wantReserved = applyQuota && isFemale && allowReserved && reservedLeft[dept] > 0;
        var wantGeneral = allowGeneral && seatsLeft[dept] > 0;
        if (wantReserved) {
          reservedLeft[dept] -= 1;
          filledByDept[dept] = (filledByDept[dept] || 0) + 1;
          cutoffByDept[dept] = s.score;
          return c;
        }
        if (wantGeneral) {
          seatsLeft[dept] -= 1;
          filledByDept[dept] = (filledByDept[dept] || 0) + 1;
          cutoffByDept[dept] = s.score;
          return c;
        }
      }
      return null;
    }

    // Pass 1
    ordered.forEach(function (s) {
      var placed = tryAssign(s, true, true);
      assignment[s.studentId] = placed ? placed.department : null;
    });

    // Pass 2: release unused reserved, re-walk the unassigned
    if (applyQuota) {
      Object.keys(reservedLeft).forEach(function (dept) {
        if (reservedLeft[dept] > 0) {
          seatsLeft[dept] = (seatsLeft[dept] || 0) + reservedLeft[dept];
          reservedLeft[dept] = 0;
        }
      });
      ordered.forEach(function (s) {
        if (assignment[s.studentId]) return;
        var placed = tryAssign(s, true, false);
        if (placed) assignment[s.studentId] = placed.department;
      });
    }

    var myRank = -1;
    for (var i = 0; i < ordered.length; i++) {
      if (ordered[i].studentId === myId) { myRank = i + 1; break; }
    }

    var myRec = students[myId] || null;
    var myAssignment = null;
    if (myRec && assignment[myId]) {
      var assignedDept = assignment[myId];
      var assignedChoice = null;
      for (var j = 0; j < myRec.choices.length; j++) {
        if (myRec.choices[j].department === assignedDept) { assignedChoice = myRec.choices[j]; break; }
      }
      myAssignment = {
        department: assignedDept,
        priority: assignedChoice ? assignedChoice.priority : null,
        score: myRec.score
      };
    }

    var allDepts = {};
    Object.keys(capacitySnapshot).forEach(function (k) { allDepts[k] = true; });
    ordered.forEach(function (s) { s.choices.forEach(function (c) { allDepts[c.department] = true; }); });

    var departments = Object.keys(allDepts).map(function (name) {
      var cap = capacitySnapshot[name] || 0;
      var filled = filledByDept[name] || 0;
      var remaining = cap - filled;
      var fillPct = cap > 0 ? Math.round((filled / cap) * 100) : 0;
      return {
        department: name,
        capacity: cap,
        filled: filled,
        remaining: remaining < 0 ? 0 : remaining,
        cutoff: cutoffByDept[name] !== undefined ? cutoffByDept[name] : null,
        fillPct: fillPct
      };
    }).sort(function (a, b) {
      return b.fillPct - a.fillPct || a.department.localeCompare(b.department);
    });

    var alternatives = [];
    if (myRec) {
      myRec.choices.forEach(function (c) {
        var dept = c.department;
        var d = null;
        for (var idx = 0; idx < departments.length; idx++) {
          if (departments[idx].department === dept) { d = departments[idx]; break; }
        }
        if (!d) return;
        var isAssignedHere = (assignment[myId] === dept);
        var hasSeatsLeft = (d.remaining > 0);
        var beatsCutoff = (d.cutoff !== null && myRec.score !== null && myRec.score >= d.cutoff);
        var wouldAssign = isAssignedHere || hasSeatsLeft || beatsCutoff;
        var reason = isAssignedHere ? 'assigned'
                   : (hasSeatsLeft ? 'seats left'
                   : (beatsCutoff ? 'scores above cutoff' : 'full (below cutoff)'));
        alternatives.push({
          department: dept,
          originalPriority: c.priority,
          cutoff: d.cutoff,
          remaining: d.remaining,
          wouldAssign: wouldAssign,
          reason: reason
        });
      });
    }

    return {
      method: {
        tieBreak: 'studentId ascending (our rule, not officially BDU\'s)',
        scoreSource: 'BDU totalScore as returned by /api/login (bonuses already applied)',
        algorithm: applyQuota
          ? 'greedy + soft female quota (20% reserved, unfilled seats released)'
          : 'greedy: sort by score desc, walk choices by priority asc, first dept with seat wins',
        femaleQuota: applyQuota ? { rate: FEMALE_QUOTA, mode: 'soft target' } : null
      },
      myAssignment: myAssignment,
      myRank: myRank > 0 ? myRank : null,
      totalApplicants: ordered.length,
      totalChoices: ordered.reduce(function (n, s) { return n + s.choices.length; }, 0),
      departments: departments,
      alternatives: alternatives
    };
  }

  root.DarkAngelsSimulator = { simulate: simulate, _groupByStudent: groupByStudent };
})(typeof window !== 'undefined' ? window : globalThis);
