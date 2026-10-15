import type {CareerCollections,ProficiencyAssessment} from './models.js';

export const RUBRIC_VERSION='1.0';
/** The original four-level CareerProof rubric, not SFIA or verified skill. */
export const PROFICIENCY_LEVELS=[
  {level:1 as const,name:'Foundational',description:'Understand concepts; perform straightforward tasks with guidance.'},
  {level:2 as const,name:'Developing',description:'Apply in familiar situations with occasional support.'},
  {level:3 as const,name:'Proficient',description:'Independently handle complex work and deliver relevant decisions or results.'},
  {level:4 as const,name:'Advanced',description:'Lead highly complex work, guide others and influence broader practices.'}
];
export function assessmentHistory(c:Pick<CareerCollections,'proficiencyAssessments'>,competencyId:string):ProficiencyAssessment[]{
  return c.proficiencyAssessments.filter(a=>a.competencyId===competencyId)
    .sort((a,b)=>b.assessmentDate.value.localeCompare(a.assessmentDate.value)||b.createdAt.localeCompare(a.createdAt)||b.id.localeCompare(a.id));
}
export function currentAssessment(c:Pick<CareerCollections,'proficiencyAssessments'>,competencyId:string):ProficiencyAssessment|null{
  return assessmentHistory(c,competencyId)[0]??null;
}
export function proficiencyLabel(level:1|2|3|4):string{
  return 'L'+level+' — '+PROFICIENCY_LEVELS[level-1]!.name;
}
