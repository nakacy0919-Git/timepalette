import fs from 'node:fs';
import {createHash} from 'node:crypto';
export function answerFingerprint(){
 const files=['src/components/world-learning/place-v1/CountryPlaceAdventure.jsx','src/components/world-learning/place-v1/PlaceAdventure.jsx','src/components/world-learning/place-v1/geographyContinents.js','src/components/world-learning/place-v1/countryPlaceAdventure.css','src/utils/geographyRwandaFormat.js','src/utils/rwandaAnswerContract.js','src/data/geography/rwanda-format-photos.json','src/data/geography/rwanda-format-names.json'];
 const hash=createHash('sha256');for(const file of files){hash.update(file);hash.update(fs.readFileSync(file));}return hash.digest('hex');
}
