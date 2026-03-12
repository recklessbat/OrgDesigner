import type { Employee, GradeLevel, LocationCostType, EmployeeType } from '../types';

const locations: { name: string; costType: LocationCostType }[] = [
  { name: 'New York, NY', costType: 'High' },
  { name: 'London, UK', costType: 'High' },
  { name: 'San Francisco, CA', costType: 'High' },
  { name: 'Chicago, IL', costType: 'Mid' },
  { name: 'Dallas, TX', costType: 'Mid' },
  { name: 'Charlotte, NC', costType: 'Mid' },
  { name: 'Bengaluru, India', costType: 'Low' },
  { name: 'Manila, Philippines', costType: 'Low' },
  { name: 'Warsaw, Poland', costType: 'Low' },
];

const jobFunctions: { function: string; families: string[]; aiImpact: number }[] = [
  { function: 'Technology', families: ['Software Engineering', 'Data Engineering', 'Infrastructure', 'QA & Testing', 'IT Support'], aiImpact: 65 },
  { function: 'Operations', families: ['Trade Operations', 'Client Onboarding', 'Reconciliation', 'Payments Processing', 'Fund Administration'], aiImpact: 78 },
  { function: 'Risk Management', families: ['Market Risk', 'Credit Risk', 'Operational Risk', 'Model Validation', 'Compliance Monitoring'], aiImpact: 55 },
  { function: 'Finance', families: ['Financial Reporting', 'FP&A', 'Tax', 'Treasury', 'Accounting'], aiImpact: 72 },
  { function: 'Sales & Trading', families: ['Equity Sales', 'Fixed Income Trading', 'FX Trading', 'Prime Brokerage', 'Research'], aiImpact: 40 },
  { function: 'Legal & Compliance', families: ['Regulatory Compliance', 'Legal Advisory', 'Contract Management', 'AML/KYC', 'Surveillance'], aiImpact: 60 },
  { function: 'Human Resources', families: ['Talent Acquisition', 'HR Business Partners', 'Compensation & Benefits', 'Learning & Development', 'Employee Relations'], aiImpact: 50 },
];

const firstNames = [
  'James', 'Sarah', 'Michael', 'Emily', 'David', 'Jennifer', 'Robert', 'Lisa',
  'William', 'Karen', 'Richard', 'Jessica', 'Thomas', 'Amanda', 'Christopher', 'Ashley',
  'Daniel', 'Stephanie', 'Matthew', 'Nicole', 'Andrew', 'Elizabeth', 'Joseph', 'Megan',
  'Raj', 'Priya', 'Amit', 'Sneha', 'Vikram', 'Ananya', 'Arjun', 'Kavya',
  'Wei', 'Yuki', 'Kenji', 'Mei', 'Hiroshi', 'Sakura', 'Chen', 'Lin',
  'Carlos', 'Maria', 'Pablo', 'Ana', 'Marco', 'Sofia', 'Luca', 'Giulia',
  'Piotr', 'Katarzyna', 'Marek', 'Agnieszka', 'Jan', 'Ewa', 'Tomasz', 'Anna',
];

const lastNames = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Miller', 'Davis', 'Garcia',
  'Rodriguez', 'Wilson', 'Martinez', 'Anderson', 'Taylor', 'Thomas', 'Moore', 'Jackson',
  'Patel', 'Sharma', 'Gupta', 'Kumar', 'Singh', 'Reddy', 'Nair', 'Mehta',
  'Chen', 'Wang', 'Li', 'Zhang', 'Liu', 'Tanaka', 'Watanabe', 'Nakamura',
  'Kowalski', 'Nowak', 'Wiśniewski', 'Wójcik', 'Kamiński', 'Lewandowski',
  'Mueller', 'Schmidt', 'Schneider', 'Fischer', 'Weber', 'Hoffmann',
];

let idCounter = 1;

function generateId(): string {
  return `EMP-${String(idCounter++).padStart(5, '0')}`;
}

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateName(): string {
  return `${randomChoice(firstNames)} ${randomChoice(lastNames)}`;
}

function gradeTitles(grade: GradeLevel, jobFamily: string): string {
  const titles: Record<GradeLevel, string[]> = {
    'Associate': ['Analyst', 'Associate', 'Junior Specialist'],
    'Senior Associate': ['Senior Analyst', 'Senior Associate', 'Specialist'],
    'VP': ['Vice President', 'VP - Team Lead', 'VP - Senior Specialist'],
    'ED': ['Executive Director', 'ED - Group Head', 'ED - Senior Lead'],
    'MD': ['Managing Director', 'MD - Division Head', 'MD - Global Head'],
  };
  return `${randomChoice(titles[grade])}, ${jobFamily}`;
}

function generateTeam(
  managerId: string,
  managerGrade: GradeLevel,
  jobFunc: typeof jobFunctions[0],
  depth: number,
  maxDepth: number
): Employee[] {
  const employees: Employee[] = [];

  const childGrades: Record<GradeLevel, { direct: GradeLevel[]; count: [number, number] }> = {
    'MD': { direct: ['ED', 'VP'], count: [3, 6] },
    'ED': { direct: ['VP', 'Senior Associate'], count: [3, 5] },
    'VP': { direct: ['Senior Associate', 'Associate'], count: [2, 5] },
    'Senior Associate': { direct: ['Associate'], count: [1, 3] },
    'Associate': { direct: [], count: [0, 0] },
  };

  const config = childGrades[managerGrade];
  if (config.direct.length === 0 || depth >= maxDepth) return employees;

  const numDirects = randomInt(config.count[0], config.count[1]);
  const family = randomChoice(jobFunc.families);

  for (let i = 0; i < numDirects; i++) {
    const grade = randomChoice(config.direct);
    const loc = randomChoice(locations);
    const empType: EmployeeType = Math.random() > 0.85 ? 'Contractor' : 'FTE';
    const familyForEmp = Math.random() > 0.3 ? family : randomChoice(jobFunc.families);
    const baseAiImpact = jobFunc.aiImpact;

    const emp: Employee = {
      id: generateId(),
      name: generateName(),
      title: gradeTitles(grade, familyForEmp),
      gradeLevel: grade,
      location: loc.name,
      locationCostType: loc.costType,
      employeeType: empType,
      jobFunction: jobFunc.function,
      jobFamily: familyForEmp,
      managerId: managerId,
      performanceRating: randomInt(1, 5),
      managerQualityScore: randomInt(1, 5),
      aiImpactScore: Math.min(100, Math.max(0, baseAiImpact + randomInt(-20, 20))),
      status: 'active',
    };

    employees.push(emp);

    // Recurse for sub-managers
    if (['MD', 'ED', 'VP'].includes(grade) && depth < maxDepth) {
      const subTeam = generateTeam(emp.id, grade, jobFunc, depth + 1, maxDepth);
      employees.push(...subTeam);
    }
  }

  return employees;
}

export function generateMockData(): Employee[] {
  idCounter = 1;
  const employees: Employee[] = [];

  // CEO
  const ceo: Employee = {
    id: generateId(),
    name: 'Alexandra Morrison',
    title: 'Chief Executive Officer',
    gradeLevel: 'MD',
    location: 'New York, NY',
    locationCostType: 'High',
    employeeType: 'FTE',
    jobFunction: 'Executive',
    jobFamily: 'C-Suite',
    managerId: null,
    performanceRating: 5,
    managerQualityScore: 5,
    aiImpactScore: 10,
    status: 'active',
  };
  employees.push(ceo);

  // Division heads - one per job function
  for (const jf of jobFunctions) {
    const divHead: Employee = {
      id: generateId(),
      name: generateName(),
      title: `MD - Global Head of ${jf.function}`,
      gradeLevel: 'MD',
      location: randomChoice(['New York, NY', 'London, UK']),
      locationCostType: 'High',
      employeeType: 'FTE',
      jobFunction: jf.function,
      jobFamily: jf.families[0],
      managerId: ceo.id,
      performanceRating: randomInt(3, 5),
      managerQualityScore: randomInt(3, 5),
      aiImpactScore: Math.max(0, jf.aiImpact - 15),
      status: 'active',
    };
    employees.push(divHead);

    const team = generateTeam(divHead.id, 'MD', jf, 1, 4);
    employees.push(...team);
  }

  // Inject some stovepipe patterns (ED->ED->ED)
  const eds = employees.filter(e => e.gradeLevel === 'ED');
  for (let i = 0; i < Math.min(3, eds.length - 1); i++) {
    const parentEd = eds[i];
    const childEds = employees.filter(e => e.managerId === parentEd.id && e.gradeLevel === 'ED');
    if (childEds.length === 0 && eds[i + 1]) {
      eds[i + 1].managerId = parentEd.id;
    }
  }

  return employees;
}
