import {TEAMS} from './catalog.mjs';
const aliases={WSH:'WAS',JAC:'JAX',LA:'LAR',STL:'LAR',SD:'LAC',OAK:'LV'};
export const PHASES={regular:'Regular season',preseason:'Preseason',wildcard:'Wild Card',divisional:'Divisional',conference:'Conference Championships',superbowl:'Super Bowl'};
export function resolveTeam(id){const team=TEAMS.find(t=>t.id===(aliases[id]||id)||t.name===id);if(!team)throw Error('Unknown team: '+id);return team.id;}
export function maxWeek(season,phase){return phase==='regular'?(season>=2021?18:17):phase==='preseason'?(season>=2021?3:4):1;}
export function validateSelection(s){if(!s||!Number.isInteger(s.season)||s.season<2010||s.season>new Date().getFullYear()+1||!Object.hasOwn(PHASES,s.phase)||!Number.isInteger(s.week)||s.week<1||s.week>maxWeek(s.season,s.phase))throw Error('Choose a valid season, phase and week.');return s;}
export function selectionKey(s){return `${s.season}/${s.phase}/${s.week}`;}
export function roundLabel(s){return `${s.season} · ${s.phase==='regular'?'Week '+s.week:s.phase==='preseason'?'Preseason week '+s.week:PHASES[s.phase]}`;}
export function espnParams(s){validateSelection(s);return {type:s.phase==='regular'?2:s.phase==='preseason'?1:3,week:s.phase==='preseason'?s.week+1:({wildcard:1,divisional:2,conference:3,superbowl:5}[s.phase]||s.week)};}
export function validateGames(games,s,{complete=true}={}){
  validateSelection(s);if(!Array.isArray(games)||!games.length||games.length>16)throw Error('The round must contain between 1 and 16 games.');
  const seen=new Set();
  const result=games.map(g=>{
    const away=resolveTeam(g.away),home=resolveTeam(g.home);
    if(away===home||seen.has(away)||seen.has(home))throw Error('Duplicate team or invalid matchup in this round.');seen.add(away);seen.add(home);
    const date=g.date||'';if(date&&(typeof date!=='string'||Number.isNaN(Date.parse(date))))throw Error('Invalid kickoff date.');
    if(typeof(g.spread??'')!=='string'||typeof(g.pick??'')!=='string'||(g.spread||'').length>80||(g.pick||'').length>80)throw Error('Spread and pick must be text of 80 characters or fewer.');
    return {away,home,date,spread:g.spread||'',pick:g.pick||''};
  });
  const expected={wildcard:s.season>=2020?6:4,divisional:4,conference:2,superbowl:1}[s.phase];
  if(complete&&expected&&result.length!==expected)throw Error('The playoff round is incomplete.');
  return result;
}
function checkRound(obj,s,p){if(Number(obj?.season?.year)!==s.season||Number(obj?.season?.type)!==p.type||Number(obj?.week?.number)!==p.week)throw Error('Schedule does not match the selected season, phase and week.');}
export function parseEspn(data,s){
  const p=espnParams(s);checkRound(data,s,p);
  if(!Array.isArray(data.events))throw Error('Invalid schedule response.');
  const games=data.events.map(e=>{
    checkRound(e,s,p);if(e.competitions?.length!==1||e.competitions[0].competitors?.length!==2)throw Error('Incomplete game.');
    const c=e.competitions[0].competitors,away=c.find(t=>t.homeAway==='away'),home=c.find(t=>t.homeAway==='home');
    if(!away||!home||!e.date||Number.isNaN(Date.parse(e.date)))throw Error('Incomplete matchup or date.');
    return {away:resolveTeam(away.team?.abbreviation),home:resolveTeam(home.team?.abbreviation),date:new Date(e.date).toISOString(),spread:'',pick:''};
  });
  return validateGames(games,s).sort((a,b)=>a.date.localeCompare(b.date)||a.away.localeCompare(b.away));
}
export function readCsv(text){
  const rows=[];let row=[],cell='',quoted=false;
  for(let i=0;i<text.length;i++){
    const c=text[i];if(c==='"'){if(quoted&&text[i+1]==='"'){cell+='"';i++;}else quoted=!quoted;}
    else if(c===','&&!quoted){row.push(cell);cell='';}
    else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[i+1]==='\n')i++;row.push(cell);if(row.some(Boolean))rows.push(row);row=[];cell='';}
    else cell+=c;
  }
  if(quoted)throw Error('Truncated CSV.');row.push(cell);if(row.some(Boolean))rows.push(row);return rows;
}
export function parseNflverse(text,s){
  validateSelection(s);if(s.phase==='preseason')throw Error('Preseason fallback is unavailable.');
  const [headers,...rows]=readCsv(text);if(!headers)throw Error('Empty schedule.');
  const columns=Object.fromEntries(headers.map((h,i)=>[h.replace(/^\uFEFF/,''),i]));
  for(const key of ['season','game_type','week','gameday','away_team','home_team'])if(!(key in columns))throw Error('Missing schedule column: '+key);
  const type={regular:'REG',wildcard:'WC',divisional:'DIV',conference:'CON',superbowl:'SB'}[s.phase];
  const games=rows.filter(r=>+r[columns.season]===s.season&&r[columns.game_type]===type&&(type!=='REG'||+r[columns.week]===s.week)).map(r=>{
    if(!r[columns.gameday])throw Error('Missing game date.');return {away:r[columns.away_team],home:r[columns.home_team],date:r[columns.gameday],spread:'',pick:''};
  });return validateGames(games,s).sort((a,b)=>a.date.localeCompare(b.date)||a.away.localeCompare(b.away));
}
async function request(url,fetcher){const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);try{const response=await fetcher(url,{signal:controller.signal});if(!response.ok)throw Error('HTTP '+response.status);const text=await response.text();if(text.length>8*1024*1024)throw Error('Schedule response is too large.');return text;}finally{clearTimeout(timer);}}
export function createScheduleLoader(fetcher=globalThis.fetch){
  const cache=new Map();
  return async s=>{
    validateSelection(s);const key=selectionKey(s),old=cache.get(key);if(old&&old.until>Date.now())return {...structuredClone(old.data),source:old.data.source+' · cached'};
    const p=espnParams(s);let games,source='ESPN';const errors=[];
    try{games=parseEspn(JSON.parse(await request(`https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?dates=${s.season}&seasontype=${p.type}&week=${p.week}&limit=1000`,fetcher)),s);}catch(e){errors.push('ESPN: '+e.message);}
    if(!games&&s.phase!=='preseason'){source='nflverse';try{games=parseNflverse(await request('https://raw.githubusercontent.com/nflverse/nfldata/master/data/games.csv',fetcher),s);}catch(e){errors.push('nflverse: '+e.message);}}
    if(!games)throw Error('No verified schedule is available for '+roundLabel(s)+'. Try again later or add matchups manually. '+errors.join(' / '));
    const data={games,source};if(cache.size>=24)cache.clear();cache.set(key,{until:Date.now()+300000,data:structuredClone(data)});return data;
  };
}
