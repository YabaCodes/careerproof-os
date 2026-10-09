import { type Competency, type CompetencyCategory } from './models.js';
const groups: [string,string,string[]][] = [
  ['TEC','Technical & Engineering',['Engineering Problem Solving','Automation & Systems Integration','Equipment Development','Manufacturing Processes','Verification & Validation','Quality & Regulatory Practices','Technical Risk Analysis','Continuous Improvement']],
  ['PRJ','Project & Program Delivery',['Project Planning & Scheduling','Scope Management','Risk & Issue Management','Vendor Management','Stakeholder Management','Change Management','Milestone & Gate Governance','Program Delivery & Execution']],
  ['LEA','Leadership & Collaboration',['Professional Communication','Cross-functional Collaboration','Mentoring & Coaching','Delegation & Accountability','Conflict Resolution','Decision-making','Team Leadership','Negotiation & Influence']],
  ['BUS','Business & Strategy',['Business Acumen','Financial Analysis','Cost & Resource Management','Strategic Planning','Process Optimization','Customer & Market Awareness','Prioritization & Trade-offs','Organizational Improvement']]
];
export function normalizeName(name: string): string { return name.normalize('NFKC').trim().toLocaleLowerCase('en-US').replace(/\s+/g,' '); }
export function builtInTaxonomy(): {competencyCategories: CompetencyCategory[]; competencies: Competency[]} {
  const base = {createdAt:'2026-10-09T00:00:00.000Z',updatedAt:'2026-10-09T00:00:00.000Z',revision:1};
  const competencyCategories: CompetencyCategory[] = [];
  const competencies: Competency[] = [];
  groups.forEach(([key,name,names],index) => {
    const categoryId = 'CP-CAT-'+key;
    competencyCategories.push({...base,id:categoryId,name,isBuiltIn:true,sortOrder:index,description:''});
    names.forEach((name,i) => {
      const id = 'CP-COMP-'+key+'-'+String(i+1).padStart(3,'0');
      competencies.push({...base,id,categoryId,name,normalizedName:normalizeName(name),isBuiltIn:true,status:'active',taxonomyKey:id,aliases:[],description:'',rubricId:null});
    });
  });
  return {competencyCategories,competencies};
}
