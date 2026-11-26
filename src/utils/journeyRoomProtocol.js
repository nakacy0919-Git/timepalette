import {buildJourneyStops} from './worldJourneyStops.js';
import {advanceGame,answerGame,buySouvenir} from './worldGameEngine.js';

export function roomCode(){return String(crypto.getRandomValues(new Uint32Array(1))[0]%1000000).padStart(6,'0');}
export function publicGame(game){
 if(!game)return null;
 const {pool,deck,geo,journeyStops,...state}=game;
 return state;
}
export function restoreGame(state){return state?{...state,journeyStops:buildJourneyStops(state.route)}:null;}
export function acceptsJourneyAction(game,action,team=null){
 return !!game&&!!action&&game.mode==='journey'&&action.round===game.round&&action.phase===game.phase&&(team===null||team===game.turn);
}
export function applyJourneyAction(game,action,team=null){
 if(!acceptsJourneyAction(game,action,team))return game;
 if(action.type==='answer')return answerGame(game,action.index);
 if(action.type==='next')return advanceGame(game);
 if(action.type==='buy'&&typeof action.item==='string')return buySouvenir(game,action.item);
 return game;
}
