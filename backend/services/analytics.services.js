const calculateDropoutRisk = (features, reasons = []) => {
  const {
    attendanceFrequency = 0,
    lastVisitGapDays = 999,
    membershipDurationDays = 0,
    visitsLast7Days = 0,
    visitsLast30Days = 0,
  } = features;

  let score = 0.0;

  // Grace period for very new members
  if (membershipDurationDays <= 14) {
    return {
      riskScore: 0.12,
      riskLevel: 'Low',
      explanation: 'New member - grace period'
    };
  }

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
  if (reasons.length > 0) {
    score += Math.min(reasons.length, 4) * 0.16;
  }

  const riskScore = Math.max(0, Math.min(1.0, score));

  let riskLevel = 'Low';
  if (riskScore >= 0.68) riskLevel = 'High';
  else if (riskScore >= 0.42) riskLevel = 'Medium';

  // Human-readable explanation
  let explanation = '';
  if (lastVisitGapDays >= 30) explanation = `Absent ${lastVisitGapDays} days`;
  else if (visitsLast30Days === 0) explanation = 'No visits last 30 days';
  else if (attendanceFrequency < 12) explanation = 'Low lifetime attendance';
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