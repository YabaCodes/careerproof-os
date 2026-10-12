import type {CareerCollections,Achievement} from './models.js';

/** CP-013A (CIF-02–07): read-only evidence breadth from recorded links.
 * This describes documentation coverage, never proficiency or verification.
 */
export type EvidenceBreadthLabel = 'Not documented'|'Emerging'|'Moderate'|'Broad';
export interface EvidenceBreadth {
  label: EvidenceBreadthLabel;
  eligibleCount: number;
  contextCount: number;
  statedOutcomeCount: number;
  eligibleAchievementIds: string[];
}

/** A primary Experience is the context; otherwise the role, then one shared unspecified context. */
export function evidenceBreadthByCompetency(c: Pick<CareerCollections,'competencies'|'achievements'|'recordLinks'>): Map<string,EvidenceBreadth> {
  const achievements=new Map(c.achievements.map(a=>[a.id,a]));
  const linked=new Map<string,Set<string>>();
  const primary=new Map<string,string>();
  for(const link of c.recordLinks){
    if(link.linkType==='achievement-competency'){
      if(!linked.has(link.targetId))linked.set(link.targetId,new Set());
      linked.get(link.targetId)!.add(link.sourceId);
    }else if(link.linkType==='achievement-project'&&link.isPrimary){
      primary.set(link.sourceId,link.targetId);
    }
  }
  const result=new Map<string,EvidenceBreadth>();
  for(const skill of c.competencies){
    const eligible:Achievement[]=[];
    for(const achievementId of linked.get(skill.id)??[]){
      const achievement=achievements.get(achievementId);
      if(achievement?.status==='recorded')eligible.push(achievement);
    }
    const contexts=new Set(eligible.map(a=>primary.has(a.id)?'project:'+primary.get(a.id):a.roleId?'role:'+a.roleId:'unspecified'));
    const statedOutcomeCount=eligible.filter(a=>a.outcome.trim().length>0).length;
    const eligibleCount=eligible.length,contextCount=contexts.size;
    const label:EvidenceBreadthLabel=eligibleCount>=3&&contextCount>=2&&statedOutcomeCount>=2?'Broad':
      eligibleCount>=2&&statedOutcomeCount>=1?'Moderate':eligibleCount>=1?'Emerging':'Not documented';
    result.set(skill.id,{label,eligibleCount,contextCount,statedOutcomeCount,eligibleAchievementIds:eligible.map(a=>a.id)});
  }
  return result;
}
