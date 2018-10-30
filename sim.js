// setting up global vars
var numSims = 0;
var numWinsFirst = 0;
var numWinsSecond = 0;
var winRateFirst = 0.0;
var winRateSecond = 0.0;
var totalInjuriesFirst = 0;
var totalInjuriesSecond = 0;
var totalRoundsFirst = 0;
var totalRoundsSecond = 0;
var monsterDivIds = [0];

// character data is a map by id
// structure: {id: {baseAttack, baseInjuries, currentAttack, currentInjuries} }
var characters = {};

// monster data
// structure: {id: {baseHealth, currentHealth} }
var monsters = {};

// values from forms
var accountForInjuries = false;
var partySize = 1;
var numMonsters = 1;

function getTotalMonsterHealth() {
  var total = 0;
  for(var id in monsters)
  {
    total += monsters[id].currentHealth;
  }
  return total;
}

function getTotalCharacterInjuries() {
  var total = 0;
  for(var id in characters)
  {
    total += characters[id].currentInjuries;
  }
  return total;
}

function changePartySize() {
  partySize = parseInt(document.getElementById("partySize").value);

  for(var x = 0; x < partySize; x++)
  {
    var partyDisplay = document.getElementById("char" + x);
    partyDisplay.style.display = "block";
  }

  // hide the rest
  for(x = partySize; x < 4; x++)
  {
    var partyDisplay = document.getElementById("char" + x);
    partyDisplay.style.display = "none";
  }
}

function getNextMonsterId() {
  // i hate this
  var id = 0;
  while(true)
  {
    var found = false;
    for(var x = 0; x < monsterDivIds.length; x++)
    {
      if(id == monsterDivIds[x])
      {
        id++;
        found = true;
        break;
      }
    }

    // if we made it here, we found a new number
    if(!found) { return id; }
  }
}

function addMonster() {
  var newDiv = document.createElement('div');
  var newId = getNextMonsterId();

  newDiv.id = "monsterStats" + newId;
  newDiv.innerHTML = 'Health: <input type="text" id="monsterHealth' + newId + '" />Action: <select id="monsterAction' + newId + '"><option value=1>Injure Random</option><option value=2>Injure All</option><option value=3>Heal 10</option><option value=4>Dodge (1)</option></select><button onclick="removeMonster(' + newId + ')">Remove</button><br />';

  document.getElementById("monsterContainer").appendChild(newDiv);
  monsterDivIds.push(newId);
}

function removeMonster(id) {
  var ele = document.getElementById("monsterStats" + id);
  ele.parentNode.removeChild(ele);
  for(var x = 0; x < monsterDivIds.length; x++)
  {
    if(id == monsterDivIds[x]) { monsterDivIds.splice(x, 1); }
  }
}

function gatherData() {
  characters = {};
  for(var x = 0; x < partySize; x++)
  {
    characters[x] = {};
    characters[x].baseAttack = parseInt(document.getElementById("cp" + x).value);
    characters[x].baseInjuries = parseInt(document.getElementById("inj" + x).value);
    characters[x].currentAttack = characters[x].baseAttack;
    characters[x].currentInjuries = characters[x].baseInjuries;
  }

  monsters = {};
  for(var x = 0; x < monsterDivIds.length; x++)
  {
    // monster id will start at partySize
    var id = monsterDivIds[x];
    monsters[id + partySize] = {};
    monsters[id + partySize].baseHealth = parseInt(document.getElementById("monsterHealth" + id).value);
    monsters[id + partySize].currentHealth = monsters[id + partySize].baseHealth;

    // current monster actions: 1 - injure random; 2 - injure all; 3 - heal 10; 4 - dodge 1
    monsters[id + partySize].action = parseInt(document.getElementById("monsterAction" + id).value);

    // setting up for status effects
    monsters[id + partySize].dodging = false;
  }

  numSims = parseInt(document.getElementById("numSims").value);
}

function runSims() {
  // reset values
  numWinsFirst = 0;
  numWinsSecond = 0;
  winRateFirst = 0.0;
  winRateSecond = 0.0;
  totalInjuriesFirst = 0;
  totalInjuriesSecond = 0;
  totalRoundsFirst = 0;
  totalRoundsSecond = 0;
  
  // gather data from form
  gatherData();

  accountForInjuries = document.getElementById("injuryPenalties").checked;

  // run the sim
  var ret = -1;
  for(var x = 0; x < numSims; x++)
  {
    var ret = runSingleSim(true);
    if(ret === true) { numWinsFirst++; }
    else if(ret === false) {
      // this is fine, just means we lost
    }
    else {
      // we returned a non-bool, which means we hit our outer safety. bail immediately so we don't nuke our browser
      break;
    }
    
    ret = runSingleSim(false);
    if(ret === true) { numWinsSecond++; }
    else if(ret === false) {
      // again, fine
    }
    else {
      break;
    }
  }
  
  if(ret === -1)
  {
    // we hit our safety
    document.getElementById("result").innerHTML = "ERROR: We hit our safety check, which usually means a fight took more than 100 full turns. So as not to nuke your browser, we bailed on the test early.";
  }
  else
  {
    // gather up results
    var numLossesFirst = numSims - numWinsFirst;
    var numLossesSecond = numSims - numWinsSecond;
    winRateFirst = numWinsFirst / numSims;
    winRateFirst *= 100;
    winRateSecond = numWinsSecond / numSims;
    winRateSecond *= 100;
    
    var avgInjuriesFirst = totalInjuriesFirst / numSims;
    var avgInjuriesSecond = totalInjuriesSecond / numSims;
    var avgRoundsFirst = totalRoundsFirst / numSims;
    var avgRoundsSecond = totalRoundsSecond / numSims;
    
    var innerHTMLString = "";
    innerHTMLString += "GOING FIRST: <br />";
    innerHTMLString += "Wins: " + numWinsFirst + " || Losses: " + numLossesFirst + " || Rate: " + winRateFirst + "% || Avg. Injuries: " + avgInjuriesFirst + " || Avg. Rounds: " + avgRoundsFirst;
    innerHTMLString += "<br />";
    innerHTMLString += "GOING SECOND: <br />";
    innerHTMLString += "Wins: " + numWinsSecond + " || Losses: " + numLossesSecond + " || Rate: " + winRateSecond + "% || Avg. Injuries: " + avgInjuriesSecond + " || Avg. Rounds: " + avgRoundsSecond;
    document.getElementById("result").innerHTML = innerHTMLString;
  }
}

function runSingleSim(goingFirst) {  
  // local vars so we can track as we go
  var totalRounds = 0;

  // reset attack/injury values
  for(var id in characters)
  {
    characters[id].currentInjuries = characters[id].baseInjuries;
    characters[id].currentAttack = characters[id].baseAttack;
  }

  // reset monster hp
  for(var id in monsters)
  {
    monsters[id].currentHealth = monsters[id].baseHealth;
  }

  // prepare our turn clock. it is a queue of IDs representing character objects and monster objects, sorted by speed (characters win ties)
  var turnClock = [];
  if(goingFirst)
  {
    for(var id in characters)
    {
      if(characters[id].currentInjuries > 0) { turnClock.push(id); }
    }

    for(var id in monsters)
    {
      if(monsters[id].currentHealth > 0) { turnClock.push(id); }
    }
  }
  else
  {
    for(var id in monsters)
    {
      if(monsters[id].currentHealth > 0) { turnClock.push(id); }
    }

    for(var id in characters)
    {
      if(characters[id].currentInjuries > 0) { turnClock.push(id); }
    }
  }

  var globalSafetyCheck = 0; // this (and the inner safetyCheck below) are here just in case i do something bad and cause an infinite loop
                             // infinite loops will cause the browser to hang for a real long time and nobody wants that
  while (getTotalMonsterHealth() >= 0) {
    globalSafetyCheck++;
    if(globalSafetyCheck > 100) { console.log("outer safety"); return -1; }

    totalRounds++;
    // RULES OF THE SIM:
    // 1. turnClock[0] is the next character to go. They target a random enemy and attack it
    //  1a. After that turn, remove them from the turn clock (turnClock.shift())
    // 2. If the recipient died, remove it from the turn clock if necessary
    // 3. Check for victory (all monsters dead) or defeat (all players dead)
    // 4. Repeat from #1 until the turn clock is empty
    // 5. Refill the turn clock and start over from #1

    var safetyCheck = 0;
    while(turnClock.length != 0)
    {
      safetyCheck++;
      if(safetyCheck > 100) { console.log("inner safety"); break; }
      
      if(turnClock[0] < partySize)
      {
        // CHARACTER TURN
        // for now, we are targeting a random monster
        var validMonsters = [];
        for(var id in monsters)
        {
          if(monsters[id].currentHealth > 0) { validMonsters.push(id); }
        }

        var whichTarget = validMonsters[Math.floor(Math.random() * validMonsters.length)];

        // are they dodging?
        if(monsters[whichTarget].dodging)
        {
          monsters[whichTarget].dodging = false;
        }
        else
        {
          monsters[whichTarget].currentHealth -= rollDamage(characters[turnClock[0]].currentAttack);
          if(monsters[whichTarget].currentHealth <= 0)
          {
            // need to remove them from the turn clock if necessary
            for(var x = 0; x < turnClock.length; x++)
            {
              if(turnClock[x] == whichTarget) { turnClock.splice(x, 1); }
            }
          }
        }

        // check for victory
        if(getTotalMonsterHealth() <= 0) { break; }
      }
      else
      {
        // MONSTER TURN
        var validTargets = [];
        for(var id in characters)
        {
          if(characters[id].currentInjuries > 0) { validTargets.push(id); }
        }

        var action = monsters[turnClock[0]].action;
        switch(action)
        {
          case 1: // injure random
          {
            // pick a target and deal dmg to it
            var whichTarget = Math.floor(Math.random() * validTargets.length);
            characters[whichTarget].currentInjuries--;

            if(accountForInjuries && characters[whichTarget].currentInjuries == 1) { characters[whichTarget].currentAttack = Math.ceil(characters[whichTarget].currentAttack / 2.0); }
            if(characters[whichTarget].currentInjuries == 0)
            {
              // need to take this character out of the turn clock if necessary
              for(var x = 0; x < turnClock.length; x++)
              {
                if(turnClock[x] == whichTarget)
                {
                  turnClock.splice(x, 1);
                }
              }
            }

            break;
          }
          case 2: // injure all
          {
            for(var id in validTargets)
            {
              characters[id].currentInjuries--;
              if(accountForInjuries && characters[id].currentInjuries == 1) { characters[id].currentAttack = Math.ceil(characters[id].currentAttack / 2.0); }
              if(characters[id].currentInjuries == 0)
              {
                // need to take this character out of the turn clock if necessary
                for(var x = 0; x < turnClock.length; x++)
                {
                  if(turnClock[x] == id)
                  {
                    turnClock.splice(x, 1);
                  }
                }
              }
            }
            break;
          }
          case 3: // heal 10
          {
            monsters[turnClock[0]].currentHealth += 10;
            if(monsters[turnClock[0]].currentHealth > monsters[turnClock[0]].baseHealth) { monsters[turnClock[0]].currentHealth = monsters[turnClock[0]].baseHealth; }
            break;
          }
          case 4: // dodge (1)
          {
            monsters[turnClock[0]].dodging = true;
            break;
          }
        }

        // check for defeat
        if(getTotalCharacterInjuries() <= 0) { break; }
      }

      // END OF TURN
      if(turnClock.length > 0) { turnClock.shift(); }
    }

    // END OF ROUND
    // we check to see if victory or defeat have happened
    if(getTotalCharacterInjuries() == 0) { break; } // if it's 0 then we're DEEEEAD

    if(getTotalMonsterHealth() <= 0) { break; } // yay

    // if not, repopulate the turn clock and let's go again!
    turnClock = [];
    if(goingFirst)
    {
      for(var id in characters)
      {
        if(characters[id].currentInjuries > 0) { turnClock.push(id); }
      }

      for(var id in monsters)
      {
        if(monsters[id].currentHealth > 0) { turnClock.push(id); }
      }
    }
    else
    {
      for(var id in monsters)
      {
        if(monsters[id].currentHealth > 0) { turnClock.push(id); }
      }

      for(var id in characters)
      {
        if(characters[id].currentInjuries > 0) { turnClock.push(id); }
      }
    }
  }

  // if we're here, we have either won or lost
  // tally up the injuries players have taken for our avg. injury counts
  var totalInjuries = 0;
  for(var id in characters)
  {
    totalInjuries += characters[id].baseInjuries - characters[id].currentInjuries;
  }

  if(goingFirst) { totalInjuriesFirst += totalInjuries; totalRoundsFirst += totalRounds; }
  else { totalInjuriesSecond += totalInjuries; totalRoundsSecond += totalRounds; }

  if (getTotalMonsterHealth() > 0) {
    return false;
  } else {
    return true;
  }
}

function rollDamage(attack) {
  var total = 0;
  var roll = 0;
  for (var x = 0; x < attack; x++) {
    roll = Math.floor(Math.random() * 3);
    total += roll;
  }
  return total;
}
