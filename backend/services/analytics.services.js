const calculateDropoutRisk = (features, reasons = []) => {
  const {
    attendanceFrequency = 0,
    lastVisitGapDays = 999,
    membershipDurationDays = 0,
    visitsLast7Days = 0,
    visitsLast30Days = 0,
  } = features;

  let score = 0.0;

  // Stronger grace period for new members
  if (membershipDurationDays <= 7) {
    return { 
      riskScore: 0.15, 
      riskLevel: 'Low', 
      explanation: 'New member - grace period' 
    };
  }

  // Strong penalty for no recent activity
  if (lastVisitGapDays >= 999) score += 0.45;
  else if (lastVisitGapDays > 30) score += 0.35;
  else if (lastVisitGapDays > 14) score += 0.25;

  // Low frequency
  score += Math.max(0, 15 - attendanceFrequency) * 0.035;

  // No visits in recent periods
  if (visitsLast7Days === 0 && membershipDurationDays > 7) score += 0.20;
  if (visitsLast30Days === 0 && membershipDurationDays > 14) score += 0.25;

  // Dropout reasons
  if (reasons.length > 0) {
    score += Math.min(reasons.length, 3) * 0.18;
  }

  const riskScore = Math.max(0, Math.min(1.0, score));

  let riskLevel = 'Low';
  if (riskScore >= 0.65) riskLevel = 'High';
  else if (riskScore >= 0.40) riskLevel = 'Medium';

  // Better explanation
  let explanation = '';
  if (lastVisitGapDays >= 999) explanation = 'No visits recorded';
  else if (lastVisitGapDays > 25) explanation = `Long absence (${lastVisitGapDays} days)`;
  else if (visitsLast30Days === 0) explanation = 'No visits in the last 30 days';
  else if (attendanceFrequency < 8) explanation = 'Low attendance frequency';
  else explanation = 'Declining engagement';

  if (reasons.length > 0) {
    explanation += ` + reported "${reasons[0].reason.replace(/_/g, ' ')}"`;
  }

  return {
    riskScore: Number(riskScore.toFixed(2)),
    riskLevel,
    explanation: explanation.trim(),
  };
};

module.exports = { calculateDropoutRisk };