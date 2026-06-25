const calculateDropoutRisk = (features, reasons = []) => {
  const {
    attendanceFrequency = 0,
    lastVisitGapDays = 999,
    membershipDurationDays = 0,
    visitsLast7Days = 0,
    visitsLast30Days = 0,
  } = features;

  let score = 0.0;

<<<<<<< HEAD
  if (membershipDurationDays <= 7) {
    return {
      riskScore: 0.15,
      riskLevel: 'Beginner',        // ← was 'Low'
=======
  // Grace period for very new members
  if (membershipDurationDays <= 14) {
    return {
      riskScore: 0.12,
      riskLevel: 'Low',
>>>>>>> 6e5e6de35ccbd5424c49060080f965f5cf0c936a
      explanation: 'New member - grace period'
    };
  }

<<<<<<< HEAD
  if (lastVisitGapDays >= 999) score += 0.45;
  else if (lastVisitGapDays > 30) score += 0.35;
  else if (lastVisitGapDays > 14) score += 0.25;

  score += Math.max(0, 15 - attendanceFrequency) * 0.035;

  if (visitsLast7Days === 0 && membershipDurationDays > 7)  score += 0.20;
  if (visitsLast30Days === 0 && membershipDurationDays > 14) score += 0.25;

=======
  // Recent inactivity (highest weight)
  if (lastVisitGapDays >= 45) score += 0.45;
  else if (lastVisitGapDays >= 21) score += 0.35;
  else if (lastVisitGapDays >= 10) score += 0.22;

  // Recent activity
  if (visitsLast7Days === 0 && membershipDurationDays > 20) score += 0.25;
  if (visitsLast30Days <= 2 && membershipDurationDays > 45) score += 0.22;

  // Lifetime frequency penalty
  const expectedVisits = Math.min(membershipDurationDays / 7 * 2.8, 120);
  const freqPenalty = Math.max(0, (expectedVisits - attendanceFrequency) / expectedVisits) * 0.28;
  score += freqPenalty;

  // Reported dropout reasons
>>>>>>> 6e5e6de35ccbd5424c49060080f965f5cf0c936a
  if (reasons.length > 0) {
    score += Math.min(reasons.length, 4) * 0.16;
  }

  const riskScore = Math.max(0, Math.min(1.0, score));

<<<<<<< HEAD
  // ── New labels ──────────────────────────────────────────────────────────
  let riskLevel = 'Beginner';       // was 'Low'
  if (riskScore >= 0.65)      riskLevel = 'Vigorous';   // was 'High'
  else if (riskScore >= 0.40) riskLevel = 'Moderate';   // was 'Medium'

  let explanation = '';
  if (lastVisitGapDays >= 999)    explanation = 'No visits recorded';
  else if (lastVisitGapDays > 25) explanation = `Long absence (${lastVisitGapDays} days)`;
  else if (visitsLast30Days === 0) explanation = 'No visits in the last 30 days';
  else if (attendanceFrequency < 8) explanation = 'Low attendance frequency';
=======
  let riskLevel = 'Low';
  if (riskScore >= 0.68) riskLevel = 'High';
  else if (riskScore >= 0.42) riskLevel = 'Medium';

  // Human-readable explanation
  let explanation = '';
  if (lastVisitGapDays >= 30) explanation = `Absent ${lastVisitGapDays} days`;
  else if (visitsLast30Days === 0) explanation = 'No visits last 30 days';
  else if (attendanceFrequency < 12) explanation = 'Low lifetime attendance';
>>>>>>> 6e5e6de35ccbd5424c49060080f965f5cf0c936a
  else explanation = 'Declining engagement';

  if (reasons.length > 0) {
    explanation += ` + reported "${reasons[0].reason.replace(/_/g, ' ')}"`;
  }

  return {
    riskScore: Number(riskScore.toFixed(2)),
    riskLevel,
    explanation: explanation.trim()
  };
};

module.exports = { calculateDropoutRisk };