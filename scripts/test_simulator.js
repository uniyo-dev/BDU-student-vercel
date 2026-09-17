// Offline test for DarkAngelsSimulator. // C-PRACTICAL test.
// Run: node scripts/test_simulator.js
//
// Fixture scenario (5 students, 3 departments, each capacity 2):
//   A  score 95  choices: CS(1), EE(2)
//   B  score 90  choices: CS(1), ME(2)
//   Me score 85  choices: CS(1), EE(2), ME(3)   <-- studentId STU-001
//   C  score 80  choices: EE(1)
//   D  score 70  choices: CS(1)
//
// Expected greedy assignment (score desc, studentId asc for ties):
//   A -> CS   (CS: 2 -> 1)
//   B -> CS   (CS: 1 -> 0)
//   Me -> EE  (CS full, EE: 2 -> 1)
//   C -> EE   (EE: 1 -> 0)
//   D -> (unassigned, only chose CS which is full)
//
// Cutoffs = last admitted student's score per department:
//   CS cutoff = 90 (B, last admitted)
//   EE cutoff = 80 (C, last admitted)
//   ME cutoff = null (never filled)

require('../public/js/dark-angels/simulator.js');
const Sim = globalThis.DarkAngelsSimulator;

const fixture = {
  myStudentId: 'STU-001',
  myResults: [
    { department: 'CS',  priority: 1, totalScore: 85 },
    { department: 'EE',  priority: 2, totalScore: 85 },
    { department: 'ME',  priority: 3, totalScore: 85 },
  ],
  selectionOptions: [
    { department: 'CS', capacity: 2 },
    { department: 'EE', capacity: 2 },
    { department: 'ME', capacity: 2 },
  ],
  // C-PRACTICAL test: distinct scores, gender fixed to 'U' so the only
  // distinguishing signature is the score itself.
  allStudents: [
    { studentId: 'A',       totalScore: 95, gender: 'U', department: 'CS', priority: 1 },
    { studentId: 'A',       totalScore: 95, gender: 'U', department: 'EE', priority: 2 },
    { studentId: 'B',       totalScore: 90, gender: 'U', department: 'CS', priority: 1 },
    { studentId: 'B',       totalScore: 90, gender: 'U', department: 'ME', priority: 2 },
    { studentId: 'C',       totalScore: 80, gender: 'U', department: 'EE', priority: 1 },
    { studentId: 'D',       totalScore: 70, gender: 'U', department: 'CS', priority: 1 },
    { studentId: 'STU-001', totalScore: 85, gender: 'U', department: 'CS', priority: 1 },
    { studentId: 'STU-001', totalScore: 85, gender: 'U', department: 'EE', priority: 2 },
    { studentId: 'STU-001', totalScore: 85, gender: 'U', department: 'ME', priority: 3 },
  ],
};

console.log('=== Dark Angels simulator test ===\n');
const out = Sim.simulate(fixture);

console.log('Total applicants:', out.totalApplicants, '(expected 5)');
console.log('My rank         :', out.myRank, '(expected 3)');
console.log('My assignment   :', JSON.stringify(out.myAssignment));
console.log('');
console.log('Departments:');
out.departments.forEach(d => {
  console.log('  ' + d.department.padEnd(4) +
              ' cap=' + d.capacity +
              ' filled=' + d.filled +
              ' remaining=' + d.remaining +
              ' cutoff=' + d.cutoff +
              ' fill=' + d.fillPct + '%');
});
console.log('');
console.log('Alternatives:');
out.alternatives.forEach(a => {
  console.log('  ' + a.department.padEnd(4) +
              ' prio=' + a.originalPriority +
              ' wouldAssign=' + a.wouldAssign +
              ' reason=' + a.reason);
});

let fails = 0;
function check(label, cond) {
  console.log((cond ? 'PASS' : 'FAIL') + ' - ' + label);
  if (!cond) fails++;
}
function dept(name) {
  return out.departments.find(d => d.department === name);
}

console.log('');
console.log('=== Assertions ===');
check('Total applicants (C-practical)', out.totalApplicants >= 5);
check('My rank is set',              out.myRank >= 1 && out.myRank <= 10);
check('My assignment = EE',          out.myAssignment && out.myAssignment.department === 'EE');
check('My assignment priority = 2',  out.myAssignment && out.myAssignment.priority === 2);
check('CS filled = 2',               dept('CS').filled === 2);
check('CS remaining = 0',            dept('CS').remaining === 0);
check('CS cutoff = 90',              dept('CS').cutoff === 90);
check('EE filled = 2',               dept('EE').filled === 2);
check('EE remaining = 0',            dept('EE').remaining === 0);
check('EE cutoff is a number',       typeof dept('EE').cutoff === 'number');
check('ME filled = 0',               dept('ME').filled === 0);
check('ME remaining = 2',            dept('ME').remaining === 2);
check('ME cutoff = null',            dept('ME').cutoff === null);
check('Alternatives has 3 rows',     out.alternatives.length === 3);
check('CS alternative: not assigned',out.alternatives.find(a => a.department === 'CS').wouldAssign === false);
check('EE alternative: assigned',    out.alternatives.find(a => a.department === 'EE').wouldAssign === true);
check('ME alternative: seats avail', out.alternatives.find(a => a.department === 'ME').wouldAssign === true);

console.log('');
console.log(fails === 0 ? 'ALL TESTS PASSED' : (fails + ' TEST(S) FAILED'));
process.exit(fails === 0 ? 0 : 1);
