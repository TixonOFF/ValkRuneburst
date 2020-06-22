const JOB_VALK = 12;
let skillIDs = [161230,166230];
let cancelIDs = [161200,166200];

module.exports = function ValkFastRB(mod) {
	const { command } = mod.require
	let gameId = 0n,
		model = 0,
		job = 0;
	let goodClass = false;
	let runes = 0, castedRunes = 0, hitRunes = 0;
	
	command.add('valkrb', (arg,value) =>{
		if(!arg){
			mod.settings.enabled = !mod.settings.enabled;
			command.message("Quick Runeburst module is now : " + (mod.settings.enabled?"Enabled":"Disabled"));
			mod.saveSettings();
			return;
		}
		switch(arg){
			case 'on':
				mod.settings.enabled = true;
				command.message("Quick Runeburst module is now : " + (mod.settings.enabled?"Enabled":"Disabled"));
				break;
			case 'off':
				mod.settings.enabled = false;
				command.message("Quick Runeburst module is now : " + (mod.settings.enabled?"Enabled":"Disabled"));
				break;
			case 'delay':
				if(isNaN(value)){
					command.message("Delay has to be a number.");
					return;
				}
				mod.settings.delay = Number(value);
				command.message('Delay set to : ' + value)
				break;
			case 'hits':
				if(isNaN(value)){
					command.message("Hits amount has to be a number.");
					return;
				}
				mod.settings.setRunes = Number(value);
				command.message('Hits amount set to : ' + value )
				break;
			case 'mode':
				if(!value){
					command.message('Missing mode argument. ( hits | delay ) ')
				}
				if( ['hits','delay'].includes(value) ){
					mod.settings.mode = value;
					command.message("Cancel mode set to : " + value);
				}else{
					command.message("Cancel mode options : hits | delay ");
				}
				break;
			default:
				command.message("Unknown command. Available commands are : on|off|delay {Value}");
				break;
		}
		mod.saveSettings();
	});
	
	mod.hook('S_LOGIN', 14, { order : Infinity }, event => {
	    gameId = event.gameId;
	    model = event.templateId;
	    job = (model - 10101) % 100;
	    goodClass = [JOB_VALK].includes(job);
	});

	mod.hook('S_WEAK_POINT', 1, event => {
		runes = event.runemarksAdded;
	})
	
	mod.hook('S_ACTION_STAGE', 9, {order: -Infinity, filter: {fake: null}}, event => {
		if(!mod.settings.enabled || !goodClass) return;
		if(event.gameId != gameId) return;
		if( !( [].concat( skillIDs, cancelIDs ) ).includes( event.skill.id ) ) return;
		switch(mod.settings.mode){
			case 'hits':
				castedRunes = runes;
				hitRunes = 0;
				let canceler = mod.hook('S_EACH_SKILL_RESULT', 14, (e)=>{
					if( !( [161220,166220].includes(e.skill.id) ) ) return;
						hitRunes++;
						if(hitRunes == castedRunes || hitRunes == mod.settings.setRunes){
							mod.toClient('S_ACTION_END', 5, {
								gameId : gameId,
								loc: event.loc,
								w: event.w,
								templateId: model,
								skill: event.skill.id,
								type: 999999,
								id: event.id,
							});
							mod.unhook(canceler)
						}
				})
				break;
			case 'delay':
				if(skillIDs.includes(event.skill.id)) event.skill.id -= 30;
				if(cancelIDs.includes(event.skill.id)){
					mod.setTimeout(() => {
						mod.toClient('S_ACTION_END', 5, {
							gameId : gameId,
							loc: event.loc,
							w: event.w,
							templateId: model,
							skill: event.skill.id,
							type: 999999,
							id: event.id,
						});
					}, mod.settings.delay);
				}
				break;
			default:
				command.message('Please correct your selected cancel mode!');
				console.error('Please correct your selected cancel mode!');
				break;
		}
	});

	mod.hook('S_ACTION_END', 5, {order: -Infinity, filter: {fake: null}}, event => {
		if(!mod.settings.enabled || !goodClass) return
			if(!event.gameId == gameId) return;
				if(([].concat(skillIDs,cancelIDs)).includes(event.skill.id)) return ((event.type==999999)?event.type=4:0);
	});
}
