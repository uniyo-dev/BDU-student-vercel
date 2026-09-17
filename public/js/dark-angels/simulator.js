// Dark Angels — Placement Simulation Engine
// Pure logic. No DOM. No fetch. No globals except the export below.
//
// Input shape (from sessionStorage.bdu_student_data.placement):
//   allStudents[]     = one row per (studentId x choice)
//                       { studentId, department, priority, totalScore, gender, ... }
//   selectionOptions[] = [{ department, capacity, applied, ... }]
//   results[]         = current student's own choices
//                       { department, priority, totalScore, status }
//
// Output shape:
//   {
//     method: { tieBreak, scoreSource, algorithm },
//     myAssignment: { department, priority, score } | null,
//     myRank: number,
//     totalApplicants: number,
//     totalChoices: number,
//     departments: [ { department, capacity, filled, remaining, cutoff, fillPct } ],
//     alternatives: [ { department, wouldAssign: bool, reason } ],
//     timeline: null  // reserved for future
//   }
//
// Algorithm (matches BDU's published rule as best we can infer it):
//   1. Group allStudents rows by studentId -> { score, choices[] }
//   2. Sort students by totalScore DESC
//      Tie-break: studentId ASC (our rule, not officially BDU's)
//   3. For each student in order:
//        walk their choices by priority ASC
//        assign to the first dept with remaining capacity
//        if none remain -> unassigned
//   4. Report student's assignment
//
// Caveats documented for UI to display:
//   - Bonuses (female / emerging region / handicapped) are already baked
//     into totalScore by BDU. We do not re-apply them.
//   - We cannot know BDU's real tie-break rule.
//   - If BDU later adjusts capacity or adds applicants, results change.

(function (root) {
  'use strict';

  function toNumber(v) {
    if (v === null || v === undefined || v === '') return null;
    if (typeof v === 'number') return isFinite(v) ? v : null;
    var n = parseFloat(String(v).replace('%', '').trim());
    return isFinite(n) ? n : null;
  }

  // Group application rows into per-student records.
  function groupByStudent(allStudents) {
    var byId = {};
    (allStudents || []).forEach(function (row) {
      if (!row || !row.studentId) return;
      var id = String(row.studentId).trim().toUpperCase();
      if (!id) return;

      var rec = byId[id];
      if (!rec) {
        rec = byId[id] = {
          studentId: id,
          score: toNumber(row.totalScore),
          gender: row.gender || '',
          choices: []
        };
      } else if (rec.score === null) {
        rec.score = toNumber(row.totalScore);
      }

      var dept = String(row.department || '').trim();
      if (!dept) return;

      var prio = toNumber(row.priority);
      if (prio === null) prio = 9999;

      // Avoid duplicates (BDU sometimes double-lists)
      for (var i = 0; i < rec.choices.length; i++) {
        if (rec.choices[i].department === dept) return;
      }
      rec.choices.push({
        department: dept,
        priority: prio,
        status: row.status || ''
      });
    });

    // Sort each student's choices by priority ascending
    Object.keys(byId).forEach(function (id) {
      byId[id].choices.sort(function (a, b) {
        return a.priority - b.priority;
      });
    });

    return byId;
  }

  // Build seat map from selectionOptions.
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

  // Main simulation. Pure function.
  // opts = { allStudents, selectionOptions, myStudentId, myResults }
  function simulate(opts) {
    opts = opts || {};
    var applyQuota = !!opts.applyFemaleQuota;
    var FEMALE_QUOTA = 0.20;
    var myId = String(opts.myStudentId || '').trim().toUpperCase();
    var students = groupByStudent(opts.allStudents);
    var seatsLeft = buildCapacity(opts.selectionOptions);
    var capacitySnapshot = {};
    Object.keys(seatsLeft).forEach(function (k) {
      capacitySnapshot[k] = seatsLeft[k];
    });

    // Reserved female pools (soft target). Only populated when quota enabled.
    var reservedLeft = {};
    if (applyQuota) {
      Object.keys(capacitySnapshot).forEach(function (dept) {
        reservedLeft[dept] = Math.floor(capacitySnapshot[dept] * FEMALE_QUOTA);
        seatsLeft[dept] = capacitySnapshot[dept] - reservedLeft[dept];
      });
    }

    // Ensure current student is present, even if allStudents is filtered
    if (myId && !students[myId]) {
      var myRec = { studentId: myId, score: null, gender: '', choices: [] };
      (opts.myResults || []).forEach(function (r) {
        if (!r || !r.department) return;
        var prio = toNumber(r.priority);
        myRec.choices.push({
          department: String(r.department).trim(),
          priority: prio === null ? 9999 : prio,
          status: r.status || ''
        });
        if (myRec.score === null) myRec.score = toNumber(r.totalScore);
      });
      myRec.choices.sort(function (a, b) { return a.priority - b.priority; });
      students[myId] = myRec;
    }

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
        var wantGeneral  = allowGeneral && seatsLeft[dept] > 0;

        // Order of preference for females: reserved first, then general.
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

    // Pass 1 — everyone tries their choices.
    ordered.forEach(function (s) {
      var placed = tryAssign(s, true, true);
      assignment[s.studentId] = placed ? placed.department : null;
    });

    // Pass 2 — soft target: release unfilled reserved seats to the general pool,
    // then re-walk ONLY students who were not yet assigned. This models the
    // "soft" in soft target — unused quota does not go to waste.
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

    var myRec2 = students[myId] || null;
    var myAssignment = null;
    if (myRec2 && assignment[myId]) {
      var assignedDept = assignment[myId];
      var assignedChoice = null;
      for (var j = 0; j < myRec2.choices.length; j++) {
        if (myRec2.choices[j].department === assignedDept) {
          assignedChoice = myRec2.choices[j];
          break;
        }
      }
      myAssignment = {
        department: assignedDept,
        priority: assignedChoice ? assignedChoice.priority : null,
        score: myRec2.score
      };
    }

    // Department fill report (union of catalog + any dept seen in choices)
    var allDepts = {};
    Object.keys(capacitySnapshot).forEach(function (k) { allDepts[k] = true; });
    ordered.forEach(function (s) {
      s.choices.forEach(function (c) { allDepts[c.department] = true; });
    });

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

    // Alternatives: for each of my choices, would I still get it if it were my #1?
    var alternatives = [];
    if (myRec2) {
      myRec2.choices.forEach(function (c) {
        var dept = c.department;
        var d = departments.filter(function (x) { return x.department === dept; })[0];
        if (!d) return;
        var wouldAssign = d.remaining > 0 || assignment[myId] === dept;
        var reason;
        if (assignment[myId] === dept) reason = 'assigned';
        else if (d.remaining > 0) reason = 'seats available';
        else reason = 'full in simulation';
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
