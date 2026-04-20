export const dashboardCards = [
  { label: 'Total Students', value: '1,248', change: '+8.4%' },
  { label: 'Average Performance Score', value: '78.6%', change: '+3.1%' },
  { label: 'Model Accuracy', value: '91.2%', change: '+1.4%' },
]

export const performanceDistribution = [
  { label: 'A', value: 88 },
  { label: 'B', value: 74 },
  { label: 'C', value: 61 },
  { label: 'D', value: 42 },
  { label: 'F', value: 19 },
]

export const recentActivities = [
  { id: 1, student: 'Aarav Patel', action: 'Submitted assignment', time: '5 min ago', risk: 'low' },
  { id: 2, student: 'Maya Singh', action: 'Attendance dropped below 70%', time: '20 min ago', risk: 'high' },
  { id: 3, student: 'Rahul Verma', action: 'Improved interaction score', time: '45 min ago', risk: 'medium' },
  { id: 4, student: 'Sara Khan', action: 'Prediction updated', time: '1 hr ago', risk: 'low' },
]

export const students = [
  {
    id: 1,
    name: 'Aarav Patel',
    attendance: 96,
    assignmentScore: 92,
    interactionScore: 88,
    riskLevel: 'Low',
    predictedScore: 94,
  },
  {
    id: 2,
    name: 'Maya Singh',
    attendance: 68,
    assignmentScore: 71,
    interactionScore: 64,
    riskLevel: 'High',
    predictedScore: 62,
  },
  {
    id: 3,
    name: 'Rahul Verma',
    attendance: 81,
    assignmentScore: 77,
    interactionScore: 75,
    riskLevel: 'Medium',
    predictedScore: 78,
  },
  {
    id: 4,
    name: 'Sara Khan',
    attendance: 89,
    assignmentScore: 84,
    interactionScore: 90,
    riskLevel: 'Low',
    predictedScore: 89,
  },
  {
    id: 5,
    name: 'Karan Mehta',
    attendance: 58,
    assignmentScore: 54,
    interactionScore: 49,
    riskLevel: 'High',
    predictedScore: 51,
  },
  {
    id: 6,
    name: 'Nisha Roy',
    attendance: 74,
    assignmentScore: 68,
    interactionScore: 72,
    riskLevel: 'Medium',
    predictedScore: 73,
  },
]

export const evaluationMetrics = [
  { label: 'Accuracy', value: '91.2%' },
  { label: 'Precision', value: '89.5%' },
  { label: 'Recall', value: '87.8%' },
  { label: 'F1 Score', value: '88.6%' },
]

export const modelComparison = [
  { model: 'Random Forest', accuracy: 91.2, precision: 89.5, recall: 87.8 },
  { model: 'Logistic Regression', accuracy: 86.8, precision: 84.9, recall: 83.7 },
  { model: 'SVM', accuracy: 88.4, precision: 86.5, recall: 85.2 },
  { model: 'KNN', accuracy: 82.6, precision: 80.3, recall: 79.4 },
]

export const highRiskStudents = students.filter((student) => student.riskLevel === 'High')
