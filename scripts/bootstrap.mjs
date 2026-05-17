import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { readFileSync } from 'fs';

const init = async () => {
    const rawData = readFileSync('./firebase-applet-config.json', 'utf-8');
    const config = JSON.parse(rawData);
    
    const app = initializeApp(config);
    const db = getFirestore(app, config.firestoreDatabaseId);

    try {
        await setDoc(doc(db, 'restaurants', 'rest_1'), {
            name: "Test Restaurant",
            adminId: "dummy_admin_id",
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        console.log("Restaurant created!");
    } catch (e) {
        console.error(e);
    }
}

init();
