// Dark Angels — Placement Simulation Engine (v4.0)
// Complete rewrite. Tier-by-tier, no cross-tier merit displacement.
//
// Rule (per user spec):
//   1. Process ALL #1 choices first, then ALL #2, then #3, etc.
//   2. Within a tier, walk students by score desc (tie: studentId asc)
//   3. Assign each student to their #tier choice if that dept has a seat
//   4. If it's full, they fall through to the NEXT tier (never displace)
//   5. Female reservation: 20% of every dept's seats held for females.
//      Females try reserved first, then general.
//   6. After all tiers: unused reserved seats release to general.
//      Unassigned students get one final walk by score.
//
// BDU does not expose real student IDs — StudentNo is a per-call row
// number. Candidates are reconstructed from (score|gender) signatures.

(function (root) {
  'use strict';

  var MAX_PICKS_PER_STUDENT = 8;
  var FEMALE_QUOTA = 0.20;
  var MAX_TIER = 5;

  // ─── Utilities ─────────────────────────────────────────────
  function toNumber(v) {
    if (v === null || v === undefined || v === '') return null;
    if (typeof v === 'number') return isFinite(v) ? v : null;
    var n = parseFloat(String(v).replace('%', '').trim());
    return isFinite(n) ? n : null;
  }

  function normalizeGender(raw) {
    var g = String(raw || '').trim().toUpperCase();
    if (g === 'M' || g === 'MALE') return 'M';
    if (g === 'F' || g === 'FEMALE') return 'F';
    return 'U';
  }

  // ─── Group raw rows into candidates by (score|gender) ──────
  function groupByStudent(allStudents) {
    var bySig = {};

    (allStudents || []).forEach(function (row) {
      if (!row) return;
      var nScore = toNumber(row.totalScore);
      if (nScore === null) return;
      var scoreKey = nScore.toFixed(3);
      var gender = normalizeGender(row.gender);
      var sig = scoreKey + '|' + gender;

      var dept = String(row.department || '').trim();
      if (!dept) return;

      var prio = parseInt(row.priority, 10);
      if (isNaN(prio) || prio < 1) prio = 9999;

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
        // Dedupe (dept) — a student can only appear once per dept
        var seen = {};
        var deduped = [];
        cand.choices.forEach(function (c) {
          if (seen[c.department]) return;
          seen[c.department] = 1;
          deduped.push(c);
        });
        deduped.sort(function (a, b) { return a.priority - b.priority; });
        cand.choices = deduped;

        if (cand.choices.length > 0) {
          out[cand.studentId] = cand;
        }
      });
    });

    return out;
  }

  // ─── Capacity map ──────────────────────────────────────────
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

  // ─── Main simulation ───────────────────────────────────────
  function simulate(opts) {
    opts = opts || {};
    var applyQuota = !!opts.applyFemaleQuota;
    var myId = String(opts.myStudentId || '').trim().toUpperCase();

    // 1. Build candidate pool
    var students = groupByStudent(opts.allStudents);

    // 2. Identify and merge the user's own clones
    var myScore = null;
    var myGender = 'U';
    (opts.myResults || []).forEach(function (r) {
      if (myScore === null && r && r.totalScore != null) myScore = toNumber(r.totalScore);
    });
    if (opts.myResults && opts.myResults.length > 0) {
      myGender = normalizeGender(opts.myResults[0].gender);
    }

    if (myScore !== null && myId) {
      var sigPrefix = myScore.toFixed(3) + '|' + myGender;
      var cloneKeys = [];
      for (var k in students) {
        if (k.indexOf(sigPrefix) === 0) cloneKeys.push(k);
      }
      if (cloneKeys.length > 0) {
        var mergedChoices = [];
        cloneKeys.forEach(function (kk) {
          students[kk].choices.forEach(function (c) { mergedChoices.push(c); });
          delete students[kk];
        });
        // Dedupe by dept, keep lowest priority
        var seen = {};
        var unique = [];
        mergedChoices.forEach(function (c) {
          if (seen[c.department]) {
            var existing = seen[c.department];
            if (c.priority < existing.priority) existing.priority = c.priority;
            return;
          }
          seen[c.department] = c;
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

    // 3. Fallback if user not in pool
    if (myId && !students[myId]) {
      var rec = { studentId: myId, score: myScore, gender: myGender, choices: [] };
      var seenU = {};
      (opts.myResults || []).forEach(function (r) {
        if (!r || !r.department) return;
        var d = String(r.department).trim();
        if (seenU[d]) return;
        var p = toNumber(r.priority);
        seenU[d] = 1;
        rec.choices.push({ department: d, priority: p === null ? 9999 : p });
      });
      rec.choices.sort(function (a, b) { return a.priority - b.priority; });
      students[myId] = rec;
    }

    // 4. Build capacity pools
    var capacity = buildCapacity(opts.selectionOptions);
    var reserved = {};   // female-only seats remaining
    var general = {};    // open seats remaining
    Object.keys(capacity).forEach(function (d) {
      var cap = capacity[d];
      if (applyQuota) {
        reserved[d] = Math.floor(cap * FEMALE_QUOTA);
      } else {
        reserved[d] = 0;
      }
      general[d] = cap - reserved[d];
    });

    var assignment = {};          // studentId → dept | null
    var cutoffByDept = {};        // dept → last admitted student's score (per tier 1)
    var filledByDept = {};        // dept → count admitted

    // 5. Tier-by-tier processing
    var orderedStudents = Object.keys(students).map(function (k) { return students[k]; });
    orderedStudents.sort(function (a, b) {
      var as = a.score === null ? -Infinity : a.score;
      var bs = b.score === null ? -Infinity : b.score;
      if (bs !== as) return bs - as;
      return a.studentId < b.studentId ? -1 : (a.studentId > b.studentId ? 1 : 0);
    });

    function tryAssignAtTier(s, tier) {
      // Find S's choice for this specific tier
      var choice = null;
      for (var i = 0; i < s.choices.length; i++) {
        if (s.choices[i].priority === tier) { choice = s.choices[i]; break; }
      }
      if (!choice) return false;
      var dept = choice.department;
      if (typeof general[dept] === 'undefined' && typeof reserved[dept] === 'undefined') return false;

      var isFemale = s.gender === 'F';

      // Female: try reserved first, then general
      if (isFemale && reserved[dept] > 0) {
        reserved[dept]--;
        filledByDept[dept] = (filledByDept[dept] || 0) + 1;
        if (tier === 1 && cutoffByDept[dept] === undefined) {
          cutoffByDept[dept] = s.score;
        } else if (tier === 1) {
          cutoffByDept[dept] = s.score;   // last admitted in tier 1
        }
        return true;
      }
      // Everyone: try general
      if (general[dept] > 0) {
        general[dept]--;
        filledByDept[dept] = (filledByDept[dept] || 0) + 1;
        if (tier === 1) {
          cutoffByDept[dept] = s.score;
        }
        return true;
      }
      return false;
    }

    for (var tier = 1; tier <= MAX_TIER; tier++) {
      for (var si = 0; si < orderedStudents.length; si++) {
        var s = orderedStudents[si];
        if (assignment[s.studentId]) continue;
        if (tryAssignAtTier(s, tier)) {
          assignment[s.studentId] = s.studentId;
          // Mark actual dept on the assignment
          var assignedChoice = null;
          for (var ci = 0; ci < s.choices.length; ci++) {
            if (s.choices[ci].priority === tier) { assignedChoice = s.choices[ci]; break; }
          }
          assignment[s.studentId] = assignedChoice ? assignedChoice.department : null;
        }
      }
    }

    // 6. Soft release — unused reserved seats to general
    if (applyQuota) {
      Object.keys(reserved).forEach(function (d) {
        if (reserved[d] > 0) {
          general[d] = (general[d] || 0) + reserved[d];
          reserved[d] = 0;
        }
      });

      // Final walk for unassigned students
      for (var fi = 0; fi < orderedStudents.length; fi++) {
        var fs = orderedStudents[fi];
        if (assignment[fs.studentId]) continue;
        for (var fi2 = 0; fi2 < fs.choices.length; fi2++) {
          var fc = fs.choices[fi2];
          if (general[fc.department] > 0) {
            general[fc.department]--;
            filledByDept[fc.department] = (filledByDept[fc.department] || 0) + 1;
            assignment[fs.studentId] = fc.department;
            break;
          }
        }
      }
    }

    // 7. Compute rank of user
    var myRank = -1;
    for (var ri = 0; ri < orderedStudents.length; ri++) {
      if (orderedStudents[ri].studentId === myId) { myRank = ri + 1; break; }
    }

    // 8. Build result
    var myRec = students[myId] || null;
    var myAssignment = null;
    var myDept = assignment[myId] || null;
    if (myRec && myDept) {
      var myChoice = null;
      for (var mci = 0; mci < myRec.choices.length; mci++) {
        if (myRec.choices[mci].department === myDept) { myChoice = myRec.choices[mci]; break; }
      }
      myAssignment = {
        department: myDept,
        priority: myChoice ? myChoice.priority : null,
        score: myRec.score
      };
    }

    // 9. Department report
    var allDepts = {};
    Object.keys(capacity).forEach(function (d) { allDepts[d] = true; });
    orderedStudents.forEach(function (s) {
      s.choices.forEach(function (c) { allDepts[c.department] = true; });
    });

    var departments = Object.keys(allDepts).map(function (name) {
      var cap = capacity[name] || 0;
      var filled = filledByDept[name] || 0;
      return {
        department: name,
        capacity: cap,
        filled: filled,
        remaining: Math.max(0, cap - filled),
        cutoff: cutoffByDept[name] !== undefined ? cutoffByDept[name] : null,
        fillPct: cap > 0 ? Math.round((filled / cap) * 100) : 0
      };
    }).sort(function (a, b) {
      return b.fillPct - a.fillPct || a.department.localeCompare(b.department);
    });

    // 10. Alternatives — "would I get in if X were my #1?"
    var alternatives = [];
    if (myRec) {
      myRec.choices.forEach(function (c) {
        var d = null;
        for (var ai = 0; ai < departments.length; ai++) {
          if (departments[ai].department === c.department) { d = departments[ai]; break; }
        }
        if (!d) return;
        var isAssignedHere = (assignment[myId] === c.department);
        var beatsCutoff = (d.cutoff !== null && myRec.score !== null && myRec.score >= d.cutoff);
        var wouldAssign = isAssignedHere || beatsCutoff || d.remaining > 0;
        var reason;
        if (isAssignedHere) reason = 'assigned';
        else if (beatsCutoff) reason = 'scores above #1 cutoff';
        else if (d.remaining > 0) reason = 'seats available';
        else reason = 'full (below #1 cutoff)';

        alternatives.push({
          department: c.department,
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
        tieBreak: 'score desc, then studentId asc',
        scoreSource: 'BDU totalScore (bonuses already applied)',
        algorithm: applyQuota
          ? 'tier-by-tier merit + 20% female reserved (soft release)'
          : 'tier-by-tier merit (no fall-through displacement)',
        femaleQuota: applyQuota ? { rate: FEMALE_QUOTA, mode: 'reserved-first, soft release' } : null
      },
      myAssignment: myAssignment,
      myRank: myRank > 0 ? myRank : null,
      totalApplicants: orderedStudents.length,
      totalChoices: orderedStudents.reduce(function (n, s) { return n + s.choices.length; }, 0),
      departments: departments,
      alternatives: alternatives
    };
  }

  root.DarkAngelsSimulator = { simulate: simulate, _groupByStudent: groupByStudent };
})(typeof window !== 'undefined' ? window : globalThis);
