import React, { useState, useMemo, useEffect } from 'react';
import { Trophy, Target, ClipboardList, LogIn, LogOut, Plus, X, Calendar, Settings, CheckCircle, AlertTriangle, Users, UserPlus, BarChart2, Shield } from 'lucide-react';

// ==========================================
// 1. SEASON PLANNER ALGORITHMS & CONSTANTS
// ==========================================
const matrix = [
  [{h:2, a:1}, {h:3, a:8}, {h:4, a:7}, {h:5, a:6}], 
  [{h:3, a:4}, {h:2, a:5}, {h:8, a:6}, {h:1, a:7}], 
  [{h:6, a:2}, {h:7, a:8}, {h:4, a:1}, {h:5, a:3}], 
  [{h:7, a:5}, {h:8, a:4}, {h:2, a:3}, {h:1, a:6}], 
  [{h:3, a:1}, {h:5, a:8}, {h:6, a:7}, {h:4, a:2}], 
  [{h:5, a:4}, {h:8, a:1}, {h:2, a:7}, {h:3, a:6}], 
  [{h:7, a:3}, {h:8, a:2}, {h:6, a:4}, {h:1, a:5}]  
];

let matrixHomeTeams = [];
for(let w=0; w<7; w++) matrixHomeTeams[w] = matrix[w].map(match => match.h);
for(let w=0; w<7; w++) matrixHomeTeams[w+7] = matrix[w].map(match => match.a);

const presetData = [
  { teams: [ { name: "Meltis", venue: "Meltis Club" }, { name: "Marston A", venue: "Marston Social Club" }, { name: "Bluebell", venue: "The Bluebell" }, { name: "Legends", venue: "Legends Bar" }, { name: "Burnaby A", venue: "The Burnaby Arms" }, { name: "Oakley Doakleys", venue: "Oakley Sports & Social Club" }, { name: "Con Club A", venue: "Constitutional Club" } ] },
  { teams: [ { name: "Fox & Hounds", venue: "Fox & Hounds" }, { name: "Fox & Duck", venue: "Fox & Duck" }, { name: "North End A", venue: "North End Social Club" }, { name: "Con Club B", venue: "Constitutional Club" }, { name: "North End B", venue: "North End Social Club" }, { name: "Con Club C", venue: "Constitutional Club" }, { name: "The Swan", venue: "The Swan" } ] },
  { teams: [ { name: "Kempston Rovers", venue: "Kempston Rovers Club" }, { name: "Burnaby B", venue: "The Burnaby Arms" }, { name: "Five Bells", venue: "The Five Bells" }, { name: "Kings Arms", venue: "The Kings Arms" }, { name: "Grafton", venue: "The Grafton" }, { name: "Oakley B", venue: "Oakley Sports & Social Club" }, { name: "The Anchor", venue: "The Anchor" } ] },
  { teams: [ { name: "Bedford Ath", venue: "Bedford Athletic Club" }, { name: "Green Man", venue: "The Green Man" }, { name: "Three Cups", venue: "The Three Cups" }, { name: "Marston B", venue: "Marston Social Club" }, { name: "Daleys", venue: "Daleys Club" }, { name: "Foresters", venue: "The Foresters Arms" }, { name: "Oakley C", venue: "Oakley Sports & Social Club" } ] }
];

const presetCompetitions = [
  "Team K.O Preliminaries", "Team K.O Round of 16", "Christmas & NY Break",
  "Singles Competition", "Team K.O QFs", "Pairs Competition",
  "Team K.O SFs", "Team K.O Final & Captains Cup", 
  "Players Championship", "Presentation Night"
];

function assignNumbersGlobally(divisionsRaw, customVenueBoardCounts) {
  let allTeams = [];
  divisionsRaw.forEach((div, dIndex) => { div.teams.forEach(t => { if(t.name) allTeams.push({ ...t, divIndex: dIndex }); }); });
  let venueTeamCounts = {};
  allTeams.forEach(t => { if(t.venue) venueTeamCounts[t.venue] = (venueTeamCounts[t.venue] || 0) + 1; });
  let venueBoardCounts = { ...customVenueBoardCounts };
  Object.keys(venueTeamCounts).forEach(v => {
    let requiredBoards = Math.ceil(venueTeamCounts[v] / 2);
    if (!venueBoardCounts[v] || venueBoardCounts[v] < requiredBoards) venueBoardCounts[v] = requiredBoards;
  });
  let venuePop = {};
  allTeams.forEach(t => { if(t.venue) venuePop[t.venue] = (venuePop[t.venue]||0) + 1; });
  allTeams.sort((a, b) => (venuePop[b.venue]||0) - (venuePop[a.venue]||0));
  let availableNumbers = divisionsRaw.map(() => [1,2,3,4,5,6,7,8]);
  let venueUsage = {};
  Object.keys(venueBoardCounts).forEach(v => { venueUsage[v] = Array(14).fill(0); });
  const numHomeWeeks = {};
  for(let num=1; num<=8; num++) {
    numHomeWeeks[num] = [];
    for(let w=0; w<14; w++) if(matrixHomeTeams[w].includes(num)) numHomeWeeks[num].push(w);
  }
  let iterations = 0;
  function solve(teamIndex) {
    if (iterations++ > 15000) return false; 
    if (teamIndex === allTeams.length) return true; 
    let team = allTeams[teamIndex];
    let divOptions = availableNumbers[team.divIndex];
    for (let i = 0; i < divOptions.length; i++) {
      let num = divOptions[i];
      let canAssign = true;
      if (team.venue) {
        for (let w of numHomeWeeks[num]) {
          if ((venueUsage[team.venue][w] || 0) + 1 > (venueBoardCounts[team.venue] || 1)) { canAssign = false; break; }
        }
      }
      if (canAssign) {
        divOptions.splice(i, 1);
        if (team.venue) for (let w of numHomeWeeks[num]) venueUsage[team.venue][w] = (venueUsage[team.venue][w]||0) + 1;
        team.assignedNum = num;
        if (solve(teamIndex + 1)) return true;
        divOptions.splice(i, 0, num);
        if (team.venue) for (let w of numHomeWeeks[num]) venueUsage[team.venue][w]--;
        delete team.assignedNum;
      }
    }
    return false; 
  }
  let success = solve(0);
  if(!success) {
    allTeams.forEach(t => { if(availableNumbers[t.divIndex].length > 0) t.assignedNum = availableNumbers[t.divIndex].shift(); });
  }
  let finalDivs = divisionsRaw.map((d, index) => ({ id: index + 1, name: d.name, teams: new Array(8).fill(null) }));
  allTeams.forEach(t => { finalDivs[t.divIndex].teams[t.assignedNum - 1] = t; });
  finalDivs.forEach(div => { for(let i=0; i<8; i++) if(!div.teams[i]) div.teams[i] = { name: "Bye", venue: "" }; });
  return { finalDivs, success };
}

// ==========================================
// 2. MAIN APPLICATION COMPONENT
// ==========================================
export default function App() {
  const [appMode, setAppMode] = useState('planner'); 
  
  // -- TRACKER STATE --
  const [activeTab, setActiveTab] = useState('tables');
  const [activeDivision, setActiveDivision] = useState(1);
  const [loggedInTeam, setLoggedInTeam] = useState(null);
  const [loginPin, setLoginPin] = useState('');
  
  // -- ADMIN STATE --
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminPinInput, setAdminPinInput] = useState('');
  const ADMIN_PIN = '999999'; // Master PIN for the league secretary
  
  // -- NEW FIXTURE VIEW STATE --
  const [fixtureViewMode, setFixtureViewMode] = useState('byWeek'); 
  const [selectedFixtureTeamId, setSelectedFixtureTeamId] = useState('');

  // Core Data
  const [teams, setTeams] = useState([]);
  const [fixtures, setFixtures] = useState([]);
  const [scheduleTimeline, setScheduleTimeline] = useState([]); 
  const [players, setPlayers] = useState([]); 
  
  // -- SUBMIT SCORE STATE --
  const [selectedFixtureId, setSelectedFixtureId] = useState('');
  
  const defaultGames = [
    { id: 1, type: 'Singles', hP1: '', hP2: '', aP1: '', aP2: '', result: '' },
    { id: 2, type: 'Singles', hP1: '', hP2: '', aP1: '', aP2: '', result: '' },
    { id: 3, type: 'Singles', hP1: '', hP2: '', aP1: '', aP2: '', result: '' },
    { id: 4, type: 'Singles', hP1: '', hP2: '', aP1: '', aP2: '', result: '' },
    { id: 5, type: 'Singles', hP1: '', hP2: '', aP1: '', aP2: '', result: '' },
    { id: 6, type: 'Doubles', hP1: '', hP2: '', aP1: '', aP2: '', result: '' },
    { id: 7, type: 'Doubles', hP1: '', hP2: '', aP1: '', aP2: '', result: '' }
  ];
  const [matchGames, setMatchGames] = useState(defaultGames);
  const [notableMoments, setNotableMoments] = useState([]);
  
  // -- TEAM MANAGEMENT STATE --
  const [newPlayerName, setNewPlayerName] = useState('');

  // ==========================================
  // PLANNER COMPONENT (ADMIN SETUP)
  // ==========================================
  const LeaguePlanner = () => {
    const [numDivs, setNumDivs] = useState(4); 
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [plannerTeams, setPlannerTeams] = useState(presetData);
    
    // Venue & Boards State
    const [venueBoardCounts, setVenueBoardCounts] = useState({});
    
    // Competitions State
    const [activePresets, setActivePresets] = useState([...presetCompetitions]);
    const [compGaps, setCompGaps] = useState({}); // New state to track custom gaps
    const [specialDatesList, setSpecialDatesList] = useState([]);
    const [customEventName, setCustomEventName] = useState('');
    const [customEventDate, setCustomEventDate] = useState('');

    useEffect(() => {
        let venues = new Set();
        let venueTeamCounts = {};
        plannerTeams.slice(0, numDivs).forEach(div => {
            div.teams.forEach(t => {
                let v = (t.venue || '').trim();
                if (v && t.name.trim() !== '') {
                    venues.add(v);
                    venueTeamCounts[v] = (venueTeamCounts[v] || 0) + 1;
                }
            });
        });
        let newCounts = { ...venueBoardCounts };
        Array.from(venues).forEach(v => {
            let required = Math.ceil(venueTeamCounts[v] / 2);
            if (!newCounts[v] || newCounts[v] < required) newCounts[v] = required;
        });
        setVenueBoardCounts(newCounts);
    }, [plannerTeams, numDivs]);

    const handleTeamChange = (divIdx, teamIdx, field, value) => {
      const newTeams = [...plannerTeams];
      if (!newTeams[divIdx]) newTeams[divIdx] = { teams: Array(7).fill({name: '', venue: ''}) };
      if (!newTeams[divIdx].teams[teamIdx]) newTeams[divIdx].teams[teamIdx] = { name: '', venue: '' };
      newTeams[divIdx].teams[teamIdx] = { ...newTeams[divIdx].teams[teamIdx], [field]: value };
      setPlannerTeams(newTeams);
    };

    const togglePresetComp = (comp) => {
        if (activePresets.includes(comp)) {
            setActivePresets(activePresets.filter(c => c !== comp));
        } else {
            setActivePresets([...activePresets, comp].sort((a,b) => presetCompetitions.indexOf(a) - presetCompetitions.indexOf(b)));
            if (!compGaps[comp]) {
                setCompGaps(prev => ({ ...prev, [comp]: 3 })); // Default 3 weeks
            }
        }
    };

    const handleAutoScheduleComps = () => {
        if(!startDate) return alert("Select a start date first.");
        let baseDate = new Date(startDate);
        let generated = [];
        activePresets.forEach((compName, idx) => {
            let gap = compGaps[compName] || 3; 
            baseDate.setDate(baseDate.getDate() + (gap * 7));
            generated.push({ name: compName, date: baseDate.toISOString().split('T')[0] });
        });
        
        let existingNotPreset = specialDatesList.filter(sd => !presetCompetitions.includes(sd.name));
        setSpecialDatesList([...existingNotPreset, ...generated].sort((a,b) => new Date(a.date) - new Date(b.date)));
    };

    const handleAddCustomDate = () => {
        if(!customEventName || !customEventDate) return;
        setSpecialDatesList([...specialDatesList, { name: customEventName, date: customEventDate }].sort((a,b) => new Date(a.date) - new Date(b.date)));
        setCustomEventName('');
        setCustomEventDate('');
    };

    const handleRemoveDate = (index) => {
        setSpecialDatesList(specialDatesList.filter((_, i) => i !== index));
    };

    const handleGenerate = () => {
      const divisionsRaw = [];
      for (let i = 0; i < numDivs; i++) {
        let divTeams = plannerTeams[i]?.teams || [];
        divisionsRaw.push({ name: `Division ${i + 1}`, teams: divTeams.filter(t => t.name.trim() !== '') });
      }

      const { finalDivs: solvedDivisions, success } = assignNumbersGlobally(divisionsRaw, venueBoardCounts);
      if (!success) console.log("Warning: Clashes possible.");

      let globalTeamId = 1;
      let trackerTeams = [];
      let initialPlayers = []; 
      
      solvedDivisions.forEach(div => {
        div.teams.forEach(team => {
          if (team.name !== 'Bye') {
            const newTeamId = globalTeamId++;
            trackerTeams.push({
              id: newTeamId,
              name: team.name,
              venue: team.venue,
              div: div.id,
              pin: Math.floor(100000 + Math.random() * 900000).toString(), 
              played: 0, won: 0, drawn: 0, lost: 0, legsFor: 0, legsAgainst: 0, pts: 0
            });
            
            // Add dummy players for Burnaby A
            if(team.name === "Burnaby A") {
               initialPlayers.push(
                 { id: 101, teamId: newTeamId, name: "Jake", played: 0, won: 0, lost: 0 },
                 { id: 102, teamId: newTeamId, name: "Dave", played: 0, won: 0, lost: 0 },
                 { id: 103, teamId: newTeamId, name: "Smithy", played: 0, won: 0, lost: 0 },
                 { id: 104, teamId: newTeamId, name: "Tom", played: 0, won: 0, lost: 0 },
                 { id: 105, teamId: newTeamId, name: "Chris", played: 0, won: 0, lost: 0 }
               );
            }
          }
        });
      });

      let trackerFixtures = [];
      let timeline = [];
      let fixtureIdCounter = 1;
      let currentDate = new Date(startDate);
      let weekCount = 0;
      
      while (weekCount < 14) {
        let dateStr = currentDate.toISOString().split('T')[0];
        let specialEvent = specialDatesList.find(sd => sd.date === dateStr);
        
        if (specialEvent) {
            timeline.push({ type: 'special', name: specialEvent.name, date: dateStr });
        } else {
            let roundNum = weekCount + 1;
            timeline.push({ type: 'league', roundNum: roundNum, date: dateStr });
            
            solvedDivisions.forEach(div => {
              matrix[weekCount % 7].forEach(m => {
                let homeNum = weekCount >= 7 ? m.a : m.h;
                let awayNum = weekCount >= 7 ? m.h : m.a;
                let homeTeamRaw = div.teams[homeNum - 1];
                let awayTeamRaw = div.teams[awayNum - 1];
                
                if (homeTeamRaw.name !== 'Bye' && awayTeamRaw.name !== 'Bye') {
                  let hTeam = trackerTeams.find(t => t.name === homeTeamRaw.name && t.div === div.id);
                  let aTeam = trackerTeams.find(t => t.name === awayTeamRaw.name && t.div === div.id);
                  if (hTeam && aTeam) {
                    trackerFixtures.push({
                      id: fixtureIdCounter++, roundNum, date: dateStr, div: div.id,
                      homeTeamId: hTeam.id, awayTeamId: aTeam.id, isPlayed: false,
                      homeScore: 0, awayScore: 0, legsData: []
                    });
                  }
                }
              });
            });
            weekCount++;
        }
        currentDate.setDate(currentDate.getDate() + 7);
      }

      setTeams(trackerTeams);
      setFixtures(trackerFixtures);
      setScheduleTimeline(timeline);
      setPlayers(initialPlayers);
      setAppMode('tracker');
    };

    return (
      <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-8 bg-white rounded-xl shadow-lg mt-8 mb-12">
        <div className="bg-slate-900 text-white p-6 rounded-lg text-center">
          <Target className="w-12 h-12 mx-auto mb-2 text-emerald-400" />
          <h1 className="text-3xl font-bold">Season Planner & Generator</h1>
          <p className="text-slate-300 mt-2">Set up your divisions, boards, and dates. We will automatically build the live tracker.</p>
        </div>

        {/* SETUP: Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-lg border border-slate-200">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Number of Divisions</label>
            <input type="number" value={numDivs} onChange={(e) => setNumDivs(parseInt(e.target.value) || 1)} min="1" max="4" className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-emerald-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">League Start Date</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-emerald-500 outline-none" />
          </div>
        </div>

        {/* SETUP: Teams */}
        <div className="space-y-6">
            <h2 className="text-xl font-bold text-slate-800 border-b pb-2">1. Teams & Venues</h2>
          {Array.from({ length: numDivs }).map((_, divIdx) => (
            <div key={divIdx} className="border rounded-lg p-4 bg-white shadow-sm">
              <h3 className="font-bold text-lg mb-3 text-emerald-700">Division {divIdx + 1}</h3>
              <div className="space-y-2">
                <div className="flex gap-2 text-xs font-bold text-slate-500 uppercase px-1">
                  <div className="w-1/2">Team Name</div>
                  <div className="w-1/2">Pub / Venue</div>
                </div>
                {Array.from({ length: 7 }).map((_, teamIdx) => (
                  <div key={teamIdx} className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder={`Team ${teamIdx + 1}`} 
                      value={plannerTeams[divIdx]?.teams[teamIdx]?.name || ''}
                      onChange={(e) => handleTeamChange(divIdx, teamIdx, 'name', e.target.value)}
                      className="w-1/2 p-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-emerald-500 outline-none" 
                    />
                    <input 
                      type="text" 
                      placeholder="Venue Name" 
                      value={plannerTeams[divIdx]?.teams[teamIdx]?.venue || ''}
                      onChange={(e) => handleTeamChange(divIdx, teamIdx, 'venue', e.target.value)}
                      className="w-1/2 p-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-emerald-500 outline-none" 
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* SETUP: Venues & Boards */}
        <div className="bg-slate-50 p-6 rounded-lg border border-slate-200">
            <h2 className="text-xl font-bold text-slate-800 mb-2 border-b border-slate-200 pb-2">2. Pub Boards Setup</h2>
            <p className="text-sm text-slate-600 mb-4">Set how many dartboards each pub has. We calculate the minimum needed automatically.</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.keys(venueBoardCounts).sort().map(vName => (
                    <div key={vName} className="flex flex-col bg-white border border-slate-300 p-3 rounded shadow-sm">
                        <span className="text-sm font-bold text-slate-800 mb-1 truncate" title={vName}>{vName}</span>
                        <div className="flex items-center gap-2">
                            <input 
                                type="number" 
                                min="1" max="10" 
                                value={venueBoardCounts[vName]} 
                                onChange={(e) => setVenueBoardCounts({...venueBoardCounts, [vName]: parseInt(e.target.value) || 1})}
                                className="w-16 p-1 border rounded text-sm text-center focus:ring-2 focus:ring-emerald-500 outline-none" 
                            />
                            <span className="text-xs text-slate-500 font-medium">Boards</span>
                        </div>
                    </div>
                ))}
                {Object.keys(venueBoardCounts).length === 0 && (
                    <p className="text-sm italic text-slate-500 col-span-4">Add teams and venues above to configure boards.</p>
                )}
            </div>
        </div>

        {/* SETUP: Competitions */}
        <div className="bg-slate-50 p-6 rounded-lg border border-slate-200">
            <h2 className="text-xl font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">3. Competitions & Special Dates</h2>
            
            <div className="mb-6">
                <p className="text-sm font-bold text-slate-700 mb-2">Toggle Included Competitions:</p>
                <div className="flex flex-wrap gap-2 mb-4">
                    {presetCompetitions.map(comp => {
                        const isActive = activePresets.includes(comp);
                        return (
                            <button 
                                key={comp}
                                onClick={() => togglePresetComp(comp)}
                                className={`text-xs py-1.5 px-3 rounded-full border transition font-medium ${isActive ? 'bg-slate-800 text-white border-slate-900' : 'bg-white text-slate-400 border-slate-300 hover:bg-slate-100 line-through'}`}
                            >
                                {comp}
                            </button>
                        )
                    })}
                </div>

                {/* NEW GAP SETTINGS UI */}
                {activePresets.length > 0 && (
                  <div className="mb-4 bg-slate-100 p-4 rounded-lg border border-slate-200">
                    <p className="text-sm font-bold text-slate-700 mb-3">Adjust Weekly Gaps (Weeks between each event):</p>
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                      {activePresets.map((comp, idx) => (
                        <div key={comp} className="flex justify-between items-center bg-white border border-slate-200 p-3 rounded-lg shadow-sm text-sm">
                          <span className="font-bold text-slate-700">{comp}</span>
                          <div className="flex items-center gap-3">
                            <input 
                              type="number" 
                              min="1" 
                              value={compGaps[comp] || 3} 
                              onChange={(e) => setCompGaps({...compGaps, [comp]: parseInt(e.target.value) || 1})}
                              className="w-16 p-2 border border-slate-300 rounded-md text-center font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                            <span className="text-xs text-slate-500 w-32 hidden md:inline-block">
                              {idx === 0 ? "weeks after Start Date" : "weeks after previous"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button onClick={handleAutoScheduleComps} className="w-full md:w-auto bg-indigo-600 text-white px-6 py-3 rounded-lg text-sm hover:bg-indigo-700 font-bold shadow-md transition">
                    ⚡ Auto-Schedule Selected Comps
                </button>
            </div>

            <div className="border-t border-slate-200 pt-6">
                <p className="text-sm font-bold text-slate-700 mb-2">Add Custom Date (e.g., Bank Holiday):</p>
                <div className="flex flex-col md:flex-row gap-2 mb-4">
                    <input type="text" placeholder="Event Name" value={customEventName} onChange={e => setCustomEventName(e.target.value)} className="flex-1 p-2 border rounded text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
                    <input type="date" value={customEventDate} onChange={e => setCustomEventDate(e.target.value)} className="p-2 border rounded text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
                    <button onClick={handleAddCustomDate} className="bg-slate-800 text-white px-4 py-2 rounded text-sm hover:bg-slate-700 transition font-bold">Add</button>
                </div>
            </div>

            {specialDatesList.length > 0 && (
                <div className="mt-4 space-y-2">
                    <h4 className="font-bold text-slate-800 text-sm">Scheduled Events:</h4>
                    {specialDatesList.map((ev, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-white border border-slate-200 p-3 rounded text-sm shadow-sm">
                            <span><strong className="text-indigo-700">{new Date(ev.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric'})}</strong> - {ev.name}</span>
                            <button onClick={() => handleRemoveDate(idx)} className="text-slate-400 hover:text-red-500 font-bold px-2"><X className="w-4 h-4"/></button>
                        </div>
                    ))}
                </div>
            )}
        </div>

        <button onClick={handleGenerate} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xl font-bold py-4 rounded-lg shadow-lg transition flex justify-center items-center gap-2">
          <Settings className="w-6 h-6" />
          Generate Season & Start Tracker
        </button>
      </div>
    );
  };

  // ==========================================
  // TRACKER COMPONENT LOGIC
  // ==========================================
  const sortedTeams = useMemo(() => {
    return teams.filter(t => t.div === activeDivision)
      .sort((a, b) => b.pts !== a.pts ? b.pts - a.pts : (b.legsFor - b.legsAgainst) - (a.legsFor - a.legsAgainst));
  }, [teams, activeDivision]);

  const sortedPlayers = useMemo(() => {
    return [...players].sort((a,b) => b.won - a.won);
  }, [players]);

  const divisionFixtures = fixtures.filter(f => f.div === activeDivision);
  const weeks = [...new Set(divisionFixtures.map(f => f.roundNum))].sort((a,b) => a-b);
  const myUnplayedFixtures = loggedInTeam ? fixtures.filter(f => (f.homeTeamId === loggedInTeam.id || f.awayTeamId === loggedInTeam.id) && !f.isPlayed) : [];

  const getTeamName = (id) => teams.find(t => t.id === id)?.name || 'Unknown';
  
  const handleUpdateGame = (id, field, value) => setMatchGames(matchGames.map(g => g.id === id ? { ...g, [field]: value } : g));

  const handleAddPlayer = (e) => {
    e.preventDefault();
    if (!newPlayerName.trim()) return;
    setPlayers([...players, { id: Date.now(), teamId: loggedInTeam.id, name: newPlayerName.trim(), played: 0, won: 0, lost: 0 }]);
    setNewPlayerName('');
  };
  
  const handleRemovePlayer = (id) => {
    setPlayers(players.filter(p => p.id !== id));
  };

  const handleScoreSubmit = (e) => {
    e.preventDefault();
    if (!selectedFixtureId) return alert("Please select a fixture.");
    const fixture = fixtures.find(f => f.id === parseInt(selectedFixtureId));
    
    let homeGamesWon = 0, awayGamesWon = 0;
    let homeLegsTotal = 0, awayLegsTotal = 0;
    let playerStatUpdates = [];

    for (let g of matchGames) {
      if (!g.result) return alert("Please fill in the 3-leg score for all 7 games.");
      if (g.type === 'Singles' && (!g.hP1 || !g.aP1)) return alert("Please select players for all singles games.");
      if (g.type === 'Doubles' && (!g.hP1 || !g.hP2 || !g.aP1 || !g.aP2)) return alert("Please select all 4 players for doubles games.");
      
      let hLegs = parseInt(g.result.charAt(0));
      let aLegs = parseInt(g.result.charAt(4)); 
      
      homeLegsTotal += hLegs;
      awayLegsTotal += aLegs;
      
      let homeWon = hLegs > aLegs;
      if (homeWon) homeGamesWon++; else awayGamesWon++;

      if (g.hP1) playerStatUpdates.push({ id: g.hP1, won: homeWon });
      if (g.type === 'Doubles' && g.hP2) playerStatUpdates.push({ id: g.hP2, won: homeWon });
      if (g.aP1) playerStatUpdates.push({ id: g.aP1, won: !homeWon });
      if (g.type === 'Doubles' && g.aP2) playerStatUpdates.push({ id: g.aP2, won: !homeWon });
    }

    setPlayers(prevPlayers => prevPlayers.map(p => {
      let stats = playerStatUpdates.filter(update => parseInt(update.id) === p.id);
      if (stats.length === 0) return p;
      let wins = stats.filter(s => s.won).length;
      let losses = stats.length - wins;
      return { ...p, played: p.played + stats.length, won: p.won + wins, lost: p.lost + losses };
    }));

    let homePts = 0, awayPts = 0, homeW = 0, homeL = 0, awayW = 0, awayL = 0;
    if (homeGamesWon > awayGamesWon) { homePts = 2; homeW = 1; awayL = 1; } 
    else { awayPts = 2; awayW = 1; homeL = 1; } 

    setTeams(prevTeams => prevTeams.map(team => {
      if (team.id === fixture.homeTeamId) return { ...team, played: team.played + 1, won: team.won + homeW, lost: team.lost + homeL, legsFor: team.legsFor + homeLegsTotal, legsAgainst: team.legsAgainst + awayLegsTotal, pts: team.pts + homePts };
      if (team.id === fixture.awayTeamId) return { ...team, played: team.played + 1, won: team.won + awayW, lost: team.lost + awayL, legsFor: team.legsFor + awayLegsTotal, legsAgainst: team.legsAgainst + homeLegsTotal, pts: team.pts + awayPts };
      return team;
    }));

    setFixtures(prevFixtures => prevFixtures.map(f => f.id === fixture.id ? { ...f, isPlayed: true, homeScore: homeGamesWon, awayScore: awayGamesWon, legsData: matchGames } : f));

    setSelectedFixtureId('');
    setMatchGames(defaultGames);
    setActiveTab('tables');
  };

  const handleLogin = () => {
    const team = teams.find(t => t.pin === loginPin.trim());
    if (team) { setLoggedInTeam(team); setActiveTab('myteam'); setLoginPin(''); } 
    else alert('Invalid PIN. Please check the tables tab to see your PIN for testing.');
  };

  const handleAdminLogin = () => {
    if (adminPinInput === ADMIN_PIN) {
      setIsAdminLoggedIn(true);
      setAdminPinInput('');
    } else {
      alert('Invalid Admin PIN.');
    }
  };

  const handleUnlockFixture = (fixtureId) => {
    if(window.confirm("Are you sure you want to unlock this fixture? This will wipe its current score and revert the league tables.")) {
      const fixture = fixtures.find(f => f.id === fixtureId);
      if (!fixture || !fixture.isPlayed) return;

      // Reverse the stats
      let homePts = 0, awayPts = 0, homeW = 0, homeL = 0, awayW = 0, awayL = 0;
      if (fixture.homeScore > fixture.awayScore) { homePts = 2; homeW = 1; awayL = 1; } 
      else { awayPts = 2; awayW = 1; homeL = 1; } 

      // Revert Teams
      setTeams(prevTeams => prevTeams.map(team => {
        if (team.id === fixture.homeTeamId) return { ...team, played: team.played - 1, won: team.won - homeW, lost: team.lost - homeL, legsFor: team.legsFor - fixture.homeScore, legsAgainst: team.legsAgainst - fixture.awayScore, pts: team.pts - homePts };
        if (team.id === fixture.awayTeamId) return { ...team, played: team.played - 1, won: team.won - awayW, lost: team.lost - awayL, legsFor: team.legsFor - fixture.awayScore, legsAgainst: team.legsAgainst - fixture.homeScore, pts: team.pts - awayPts };
        return team;
      }));

      // Revert Players
      setPlayers(prevPlayers => prevPlayers.map(p => {
        let statsToReverse = fixture.legsData ? fixture.legsData.flatMap(g => {
            let updates = [];
            let homeWon = parseInt(g.result.charAt(0)) > parseInt(g.result.charAt(4));
            if (g.hP1 == p.id) updates.push(homeWon);
            if (g.hP2 == p.id) updates.push(homeWon);
            if (g.aP1 == p.id) updates.push(!homeWon);
            if (g.aP2 == p.id) updates.push(!homeWon);
            return updates;
        }) : [];
        
        if (statsToReverse.length === 0) return p;
        let winsToSubtract = statsToReverse.filter(won => won).length;
        let lossesToSubtract = statsToReverse.length - winsToSubtract;
        return { ...p, played: p.played - statsToReverse.length, won: p.won - winsToSubtract, lost: p.lost - lossesToSubtract };
      }));

      // Unlock Fixture
      setFixtures(prevFixtures => prevFixtures.map(f => f.id === fixtureId ? { ...f, isPlayed: false, homeScore: 0, awayScore: 0, legsData: [] } : f));
    }
  };

  const handleReturnToPlanner = () => {
    if(window.confirm("WARNING: Returning to the season planner will wipe all current scores, player stats, and league tables. Are you absolutely sure?")) {
      setIsAdminLoggedIn(false);
      setActiveTab('tables');
      setAppMode('planner');
    }
  };

  if (appMode === 'planner') return <div className="min-h-screen bg-slate-100 py-1"><LeaguePlanner /></div>;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-12">
      <header className="bg-slate-900 text-white p-4 shadow-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Target className="w-8 h-8 text-emerald-400" />
            <h1 className="text-xl font-bold tracking-tight">Bedford League</h1>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setActiveTab('admin')} className={`flex items-center space-x-1 px-3 py-2 rounded-md transition text-xs font-bold ${activeTab === 'admin' ? 'bg-emerald-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'}`}>
               <Shield className="w-4 h-4" /> <span className="hidden md:inline">League Admin</span>
           </button>
            {loggedInTeam ? (
              <button onClick={() => { setLoggedInTeam(null); setActiveTab('tables'); }} className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-md transition text-sm">
                <LogOut className="w-4 h-4" /> <span className="hidden md:inline">Logout {loggedInTeam.name}</span>
              </button>
            ) : (
              <button onClick={() => setActiveTab('login')} className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-500 px-3 py-2 rounded-md transition text-sm font-semibold">
                <LogIn className="w-4 h-4" /> <span className="hidden md:inline">Captain Login</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 mt-6">
        
        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 mb-6 border-b border-slate-200 pb-2">
          <button onClick={() => setActiveTab('tables')} className={`flex items-center space-x-2 px-4 py-2 rounded-t-lg transition ${activeTab === 'tables' ? 'bg-slate-200 text-slate-900 font-semibold' : 'text-slate-500 hover:bg-slate-100'}`}>
            <Trophy className="w-5 h-5" /> <span className="hidden sm:inline">League Tables</span>
          </button>
          <button onClick={() => setActiveTab('fixtures')} className={`flex items-center space-x-2 px-4 py-2 rounded-t-lg transition ${activeTab === 'fixtures' ? 'bg-slate-200 text-slate-900 font-semibold' : 'text-slate-500 hover:bg-slate-100'}`}>
            <Calendar className="w-5 h-5" /> <span className="hidden sm:inline">Fixtures & Results</span>
          </button>
          <button onClick={() => setActiveTab('stats')} className={`flex items-center space-x-2 px-4 py-2 rounded-t-lg transition ${activeTab === 'stats' ? 'bg-slate-200 text-slate-900 font-semibold' : 'text-slate-500 hover:bg-slate-100'}`}>
            <BarChart2 className="w-5 h-5" /> <span className="hidden sm:inline">Player Stats</span>
          </button>
          
          {loggedInTeam && (
            <>
              <button onClick={() => setActiveTab('myteam')} className={`flex items-center space-x-2 px-4 py-2 rounded-t-lg transition ${activeTab === 'myteam' ? 'bg-indigo-100 text-indigo-900 font-semibold' : 'text-slate-500 hover:bg-slate-100'}`}>
                <Users className="w-5 h-5" /> <span className="hidden sm:inline">My Squad</span>
              </button>
              <button onClick={() => setActiveTab('submit')} className={`flex items-center space-x-2 px-4 py-2 rounded-t-lg transition ${activeTab === 'submit' ? 'bg-slate-200 text-slate-900 font-semibold' : 'text-slate-500 hover:bg-slate-100'}`}>
                <ClipboardList className="w-5 h-5" /> <span className="hidden sm:inline">Submit Score</span>
              </button>
            </>
          )}
        </div>

        {/* Division Selector */}
        {(activeTab === 'tables' || activeTab === 'fixtures') && (
          <div className="bg-white rounded-t-xl shadow-sm border border-slate-200 p-4 border-b-0 flex space-x-2 overflow-x-auto">
            {[...new Set(teams.map(t => t.div))].sort().map(divNum => (
              <button key={divNum} onClick={() => { setActiveDivision(divNum); setSelectedFixtureTeamId(''); }} className={`px-4 py-2 rounded-md text-sm font-medium transition ${activeDivision === divNum ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border'}`}>Div {divNum}</button>
            ))}
          </div>
        )}

        {/* View: League Tables */}
        {activeTab === 'tables' && (
          <div className="bg-white rounded-b-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-sm uppercase tracking-wider">
                    <th className="p-4 font-medium">Team</th>
                    <th className="p-4 font-medium text-center">P</th>
                    <th className="p-4 font-medium text-center">W</th>
                    <th className="p-4 font-medium text-center">L</th>
                    <th className="p-4 font-medium text-center hidden sm:table-cell">Legs F/A</th>
                    <th className="p-4 font-bold text-center text-slate-900">Pts</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sortedTeams.map((team, index) => (
                    <tr key={team.id} className="hover:bg-slate-50">
                      <td className="p-4 font-semibold text-slate-900">
                        {index + 1}. {team.name} 
                        <span className="text-xs font-mono text-emerald-600 ml-2 bg-emerald-50 px-1 rounded block sm:inline">PIN: {team.pin}</span>
                      </td>
                      <td className="p-4 text-center">{team.played}</td>
                      <td className="p-4 text-center text-emerald-600">{team.won}</td>
                      <td className="p-4 text-center text-red-500">{team.lost}</td>
                      <td className="p-4 text-center text-slate-500 hidden sm:table-cell">{team.legsFor} - {team.legsAgainst}</td>
                      <td className="p-4 text-center font-bold text-emerald-600 text-lg">{team.pts}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* View: Fixtures (Chronological Timeline or By Team) */}
        {activeTab === 'fixtures' && (
          <div className="bg-white rounded-b-xl shadow-sm border border-slate-200 p-4 md:p-6">
             
             {/* View Toggles */}
             <div className="flex flex-col sm:flex-row gap-4 mb-6 justify-between items-start sm:items-center border-b border-slate-100 pb-4">
               <div className="flex bg-slate-100 p-1 rounded-lg">
                  <button onClick={() => setFixtureViewMode('byWeek')} className={`px-4 py-2 rounded-md text-sm font-bold transition ${fixtureViewMode === 'byWeek' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>By Week</button>
                  <button onClick={() => setFixtureViewMode('byTeam')} className={`px-4 py-2 rounded-md text-sm font-bold transition ${fixtureViewMode === 'byTeam' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>By Team</button>
               </div>

               {fixtureViewMode === 'byTeam' && (
                 <select
                    value={selectedFixtureTeamId}
                    onChange={(e) => setSelectedFixtureTeamId(e.target.value)}
                    className="w-full sm:w-auto p-2 border border-slate-300 rounded-md text-sm bg-slate-50 outline-none focus:ring-2 focus:ring-emerald-500 font-semibold text-slate-700"
                 >
                    <option value="">Select a team...</option>
                    {teams.filter(t => t.div === activeDivision).map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                 </select>
               )}
             </div>

             <div className="space-y-6">
               {fixtureViewMode === 'byTeam' && !selectedFixtureTeamId ? (
                 <p className="text-center text-slate-500 italic py-8">Please select a team from the dropdown to view their specific fixtures.</p>
               ) : (
                 scheduleTimeline.map((block, index) => {
                   
                   // Special Events (Always show)
                   if (block.type === 'special') {
                       return (
                           <div key={`special-${index}`} className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 flex justify-between items-center shadow-sm">
                               <div className="flex items-center gap-3">
                                   <AlertTriangle className="w-5 h-5 text-indigo-500 hidden sm:block" />
                                   <h3 className="text-lg font-bold text-indigo-900 uppercase">{block.name}</h3>
                               </div>
                               <span className="text-sm font-semibold text-indigo-700 bg-indigo-100 px-3 py-1 rounded-full">{new Date(block.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric'})}</span>
                           </div>
                       )
                   }
                   
                   // League Weeks
                   const weekMatches = divisionFixtures.filter(f => f.roundNum === block.roundNum);
                   
                   // If filtering by team, find their specific match
                   if (fixtureViewMode === 'byTeam' && selectedFixtureTeamId) {
                       const myMatch = weekMatches.find(m => m.homeTeamId === parseInt(selectedFixtureTeamId) || m.awayTeamId === parseInt(selectedFixtureTeamId));
                       
                       return (
                         <div key={`week-${block.roundNum}`} className="border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                           <h3 className="text-lg font-bold bg-slate-800 text-white p-3 flex justify-between items-center">
                             <span>Week {block.roundNum}</span>
                             <span className="text-sm font-normal text-slate-300 bg-slate-700 px-2 py-1 rounded">{new Date(block.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric'})}</span>
                           </h3>
                           <div className="bg-white p-4">
                               {!myMatch ? (
                                   <div className="text-center text-slate-400 font-bold italic py-2">BYE WEEK</div>
                               ) : (
                                   <div className="flex flex-col sm:flex-row justify-between items-center">
                                       <div className={`w-full sm:w-2/5 text-center sm:text-right font-semibold ${myMatch.homeTeamId === parseInt(selectedFixtureTeamId) ? 'text-emerald-700' : 'text-slate-800'} mb-2 sm:mb-0`}>
                                           {getTeamName(myMatch.homeTeamId)}
                                       </div>
                                       <div className="w-full sm:w-1/5 text-center my-2 sm:my-0 flex justify-center">
                                         {myMatch.isPlayed ? (
                                           <span className="bg-emerald-100 text-emerald-800 font-bold px-3 py-1 rounded-full border border-emerald-200">
                                             {myMatch.homeScore} - {myMatch.awayScore}
                                           </span>
                                         ) : (
                                           <span className="bg-slate-100 text-slate-500 font-bold px-3 py-1 rounded-full text-sm">VS</span>
                                         )}
                                       </div>
                                       <div className={`w-full sm:w-2/5 text-center sm:text-left font-semibold ${myMatch.awayTeamId === parseInt(selectedFixtureTeamId) ? 'text-emerald-700' : 'text-slate-800'} mt-2 sm:mt-0`}>
                                           {getTeamName(myMatch.awayTeamId)}
                                       </div>
                                   </div>
                               )}
                           </div>
                         </div>
                       );
                   }

                   // "By Week" Mode (Show all matches)
                   if (weekMatches.length === 0) return null; 

                   return (
                     <div key={`week-${block.roundNum}`} className="border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                       <h3 className="text-lg font-bold bg-slate-800 text-white p-3 flex justify-between items-center">
                         <span>Week {block.roundNum}</span>
                         <span className="text-sm font-normal text-slate-300 bg-slate-700 px-2 py-1 rounded">{new Date(block.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric'})}</span>
                       </h3>
                       <div className="divide-y divide-slate-100 bg-white">
                         {weekMatches.map(match => (
                           <div key={match.id} className="p-4 flex flex-col sm:flex-row justify-between items-center hover:bg-slate-50 transition">
                             <div className="w-full sm:w-2/5 text-center sm:text-right font-semibold text-slate-800 mb-2 sm:mb-0">
                               {getTeamName(match.homeTeamId)}
                             </div>
                             <div className="w-full sm:w-1/5 text-center my-2 sm:my-0 flex justify-center">
                               {match.isPlayed ? (
                                 <span className="bg-emerald-100 text-emerald-800 font-bold px-3 py-1 rounded-full border border-emerald-200">
                                   {match.homeScore} - {match.awayScore}
                                 </span>
                               ) : (
                                 <span className="bg-slate-100 text-slate-500 font-bold px-3 py-1 rounded-full text-sm">VS</span>
                               )}
                             </div>
                             <div className="w-full sm:w-2/5 text-center sm:text-left font-semibold text-slate-800 mt-2 sm:mt-0">
                               {getTeamName(match.awayTeamId)}
                             </div>
                           </div>
                         ))}
                       </div>
                     </div>
                   );
                 })
               )}
             </div>
          </div>
        )}

        {/* View: Player Stats */}
        {activeTab === 'stats' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
             <h2 className="text-xl font-bold mb-4 text-slate-800 border-b pb-2">League Leaderboard (Total Wins)</h2>
             {sortedPlayers.length === 0 ? (
                 <p className="text-slate-500 italic">No players have been added by captains yet.</p>
             ) : (
                 <div className="space-y-2">
                     {sortedPlayers.map((p, index) => (
                         <div key={p.id} className="flex justify-between items-center p-3 border rounded-lg bg-slate-50">
                             <div>
                                 <span className="font-bold text-slate-700 w-6 inline-block">{index + 1}.</span>
                                 <span className="font-semibold text-slate-900">{p.name}</span>
                                 <span className="text-xs text-slate-500 ml-2">({getTeamName(p.teamId)})</span>
                             </div>
                             <div className="flex gap-4 text-sm font-medium">
                                 <span className="text-slate-500">Played: {p.played}</span>
                                 <span className="text-emerald-600 font-bold">Wins: {p.won}</span>
                             </div>
                         </div>
                     ))}
                 </div>
             )}
          </div>
        )}

        {/* View: My Team (Captain Portal) */}
        {activeTab === 'myteam' && loggedInTeam && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 max-w-2xl mx-auto">
             <div className="flex items-center gap-3 mb-6 border-b pb-4">
                 <div className="bg-indigo-100 p-3 rounded-full"><Users className="w-6 h-6 text-indigo-700" /></div>
                 <div>
                     <h2 className="text-2xl font-bold text-slate-900">{loggedInTeam.name} Squad</h2>
                     <p className="text-sm text-slate-500">Manage your roster so players can be selected on match night.</p>
                 </div>
             </div>

             <form onSubmit={handleAddPlayer} className="flex gap-2 mb-6">
                 <input type="text" value={newPlayerName} onChange={e=>setNewPlayerName(e.target.value)} placeholder="Enter player name..." className="flex-1 p-3 border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none" required/>
                 <button type="submit" className="bg-indigo-600 text-white px-4 rounded font-bold hover:bg-indigo-700 transition flex items-center gap-1"><UserPlus className="w-4 h-4"/> Add</button>
             </form>

             <div className="space-y-2">
                 {players.filter(p => p.teamId === loggedInTeam.id).length === 0 ? (
                     <p className="text-center text-slate-500 italic py-4">No players registered. Add your squad above!</p>
                 ) : (
                     players.filter(p => p.teamId === loggedInTeam.id).map(p => (
                         <div key={p.id} className="flex justify-between items-center p-3 border rounded-lg bg-slate-50">
                             <span className="font-semibold">{p.name}</span>
                             <div className="flex items-center gap-4">
                                 <span className="text-xs font-bold text-slate-400">Played: {p.played} | Won: {p.won}</span>
                                 <button onClick={() => handleRemovePlayer(p.id)} className="text-red-400 hover:text-red-600"><X className="w-5 h-5"/></button>
                             </div>
                         </div>
                     ))
                 )}
             </div>
          </div>
        )}

        {/* View: Submit Score (Detailed Leg Entry) */}
        {activeTab === 'submit' && loggedInTeam && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 md:p-6 max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-2 text-slate-900 flex items-center">
              <ClipboardList className="w-6 h-6 mr-2 text-emerald-600" /> Complete Match Sheet
            </h2>
            <p className="text-sm text-slate-500 mb-6 border-b pb-4">
              Welcome, <strong>{loggedInTeam.name}</strong>! Ensure your squad is registered in the "My Squad" tab before submitting.
            </p>
            
            <form onSubmit={handleScoreSubmit} className="space-y-8">
              {/* Fixture Selection */}
              <div className="bg-amber-50 p-4 border border-amber-200 rounded-lg">
                <label className="block text-sm font-bold text-amber-900 mb-2">Select Unplayed Fixture</label>
                <div className="space-y-2">
                  {myUnplayedFixtures.length === 0 ? (
                    <p className="text-sm text-amber-700 italic">No pending fixtures.</p>
                  ) : (
                    myUnplayedFixtures.map(f => (
                      <label key={f.id} className={`flex items-center p-3 border rounded-lg cursor-pointer transition ${selectedFixtureId == f.id ? 'bg-amber-100 border-amber-400' : 'bg-white hover:bg-slate-50'}`}>
                        <input type="radio" name="fixture" value={f.id} onChange={(e) => setSelectedFixtureId(e.target.value)} checked={selectedFixtureId == f.id} className="w-4 h-4 text-amber-600 focus:ring-amber-500 mr-3" />
                        <span className="font-semibold">{getTeamName(f.homeTeamId)} vs {getTeamName(f.awayTeamId)}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>

              {selectedFixtureId && (
                <div className="bg-slate-50 rounded-lg border border-slate-200 overflow-hidden">
                  <div className="bg-slate-800 text-white p-3"><h3 className="font-bold">The 7 Games (Best of 3)</h3></div>
                  <div className="p-2 md:p-4 space-y-4">
                    {matchGames.map((game) => {
                      const currentFixture = fixtures.find(f => f.id === parseInt(selectedFixtureId));
                      const homePlayers = players.filter(p => p.teamId === currentFixture.homeTeamId);
                      const awayPlayers = players.filter(p => p.teamId === currentFixture.awayTeamId);

                      return (
                      <div key={game.id} className="bg-white p-3 rounded border border-slate-200 shadow-sm flex flex-col gap-3">
                        <div className="flex justify-between items-center border-b pb-2">
                            <span className="font-bold text-slate-500 text-xs uppercase bg-slate-100 px-2 py-1 rounded">Game {game.id}: {game.type}</span>
                            <select value={game.result} onChange={(e) => handleUpdateGame(game.id, 'result', e.target.value)} className="w-32 p-1 border rounded text-sm font-bold bg-amber-50 focus:ring-2 focus:ring-emerald-500 text-center" required>
                                <option value="">Score...</option>
                                <option value="3 - 0">3 - 0</option><option value="2 - 1">2 - 1</option>
                                <option value="1 - 2">1 - 2</option><option value="0 - 3">0 - 3</option>
                            </select>
                        </div>
                        <div className="flex flex-col md:flex-row gap-4">
                            {/* HOME SIDE */}
                            <div className="flex-1 space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase">Home Player(s)</label>
                                <select value={game.hP1} onChange={(e) => handleUpdateGame(game.id, 'hP1', e.target.value)} className="w-full p-2 border rounded text-sm bg-slate-50" required>
                                    <option value="">Select Home Player...</option>
                                    {homePlayers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                                {game.type === 'Doubles' && (
                                    <select value={game.hP2} onChange={(e) => handleUpdateGame(game.id, 'hP2', e.target.value)} className="w-full p-2 border rounded text-sm bg-slate-50" required>
                                        <option value="">Select 2nd Home Player...</option>
                                        {homePlayers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                )}
                            </div>
                            <div className="hidden md:flex items-center justify-center text-xs font-bold text-slate-300">VS</div>
                            {/* AWAY SIDE */}
                            <div className="flex-1 space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase">Away Player(s)</label>
                                <select value={game.aP1} onChange={(e) => handleUpdateGame(game.id, 'aP1', e.target.value)} className="w-full p-2 border rounded text-sm bg-slate-50" required>
                                    <option value="">Select Away Player...</option>
                                    {awayPlayers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                                {game.type === 'Doubles' && (
                                    <select value={game.aP2} onChange={(e) => handleUpdateGame(game.id, 'aP2', e.target.value)} className="w-full p-2 border rounded text-sm bg-slate-50" required>
                                        <option value="">Select 2nd Away Player...</option>
                                        {awayPlayers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                )}
                            </div>
                        </div>
                      </div>
                    )})}
                  </div>
                  <div className="p-4">
                      <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-lg shadow-md transition flex justify-center items-center gap-2">
                        <CheckCircle className="w-6 h-6" /> Submit Official Match Sheet
                      </button>
                  </div>
                </div>
              )}
            </form>
          </div>
        )}

        {/* View: Login Mockup */}
        {activeTab === 'login' && !loggedInTeam && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 max-w-md mx-auto mt-10 text-center">
            <div className="mx-auto bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mb-4">
              <LogIn className="w-8 h-8 text-slate-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Captain Portal</h2>
            <p className="text-slate-500 mb-6">Enter your 6-digit PIN to manage your squad and results.</p>
            <div className="space-y-4">
              <input type="text" placeholder="000000" value={loginPin} onChange={(e) => setLoginPin(e.target.value)} maxLength={6} className="w-full bg-slate-50 border border-slate-300 rounded-md py-3 px-4 outline-none focus:ring-2 focus:ring-emerald-500 text-center tracking-widest font-mono text-xl font-bold" />
              <button onClick={handleLogin} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-lg shadow transition">Secure Login</button>
            </div>
          </div>
        )}

        {/* View: Admin Login & Dashboard */}
        {activeTab === 'admin' && (
          <div className="max-w-4xl mx-auto mt-6">
            {!isAdminLoggedIn ? (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 max-w-md mx-auto text-center">
                <div className="mx-auto bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                  <Shield className="w-8 h-8 text-slate-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">League Admin</h2>
                <p className="text-slate-500 mb-6">Enter the master PIN to manage the league. (Demo PIN: 999999)</p>
                <div className="space-y-4">
                  <input type="password" placeholder="Admin PIN" value={adminPinInput} onChange={(e) => setAdminPinInput(e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-md py-3 px-4 outline-none focus:ring-2 focus:ring-emerald-500 text-center tracking-widest font-mono text-xl font-bold" />
                  <button onClick={handleAdminLogin} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-lg shadow transition">Access Dashboard</button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-slate-900 text-white p-6 rounded-xl flex justify-between items-center shadow-md">
                  <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2"><Shield className="w-6 h-6 text-emerald-400"/> Admin Dashboard</h2>
                    <p className="text-slate-300 text-sm mt-1">Manage team access and override match results.</p>
                  </div>
                  <button onClick={() => setIsAdminLoggedIn(false)} className="bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded text-sm font-bold transition">Log Out</button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Team PINs */}
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 max-h-96 overflow-y-auto">
                    <h3 className="font-bold text-lg mb-4 text-slate-800 border-b pb-2">Captain PIN Recovery</h3>
                    <div className="space-y-2">
                      {teams.map(t => (
                        <div key={t.id} className="flex justify-between items-center bg-slate-50 p-2 rounded border border-slate-100">
                          <span className="font-semibold text-sm">{t.name} <span className="text-xs text-slate-400 font-normal">({t.venue})</span></span>
                          <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded">{t.pin}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Danger Zone */}
                  <div className="bg-red-50 p-6 rounded-xl shadow-sm border border-red-200 flex flex-col justify-center text-center">
                    <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                    <h3 className="font-bold text-xl text-red-900 mb-2">Danger Zone</h3>
                    <p className="text-sm text-red-700 mb-6">Need to change the schedule, add a team, or restart the season? This will erase all current match data.</p>
                    <button onClick={handleReturnToPlanner} className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg shadow transition">
                      Wipe Data & Return to Planner
                    </button>
                  </div>
                </div>

                {/* Fixture Management */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                  <h3 className="font-bold text-lg mb-4 text-slate-800 border-b pb-2">Completed Fixture Management</h3>
                  <p className="text-sm text-slate-500 mb-4">If a captain submits an incorrect score, you can unlock it here. This reverses the league table points and player stats, allowing the captain to submit it again.</p>
                  
                  <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                    {fixtures.filter(f => f.isPlayed).length === 0 ? (
                      <p className="text-center text-slate-400 italic py-4">No fixtures have been played yet.</p>
                    ) : (
                      fixtures.filter(f => f.isPlayed).sort((a,b) => b.roundNum - a.roundNum).map(f => (
                        <div key={f.id} className="flex flex-col sm:flex-row justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-200">
                          <div className="flex flex-col sm:flex-row items-center gap-4 mb-2 sm:mb-0">
                            <span className="text-xs font-bold text-slate-400 bg-white px-2 py-1 rounded border">Wk {f.roundNum}</span>
                            <span className="font-semibold text-slate-700">{getTeamName(f.homeTeamId)} <span className="text-emerald-600 font-bold mx-2">{f.homeScore} - {f.awayScore}</span> {getTeamName(f.awayTeamId)}</span>
                          </div>
                          <button onClick={() => handleUnlockFixture(f.id)} className="text-xs bg-amber-100 text-amber-800 hover:bg-amber-200 px-3 py-1.5 rounded font-bold transition">
                            Unlock / Reset Score
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}
