import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, serverTimestamp, getDoc, collection, writeBatch } from 'firebase/firestore';
import { readFileSync } from 'fs';

const initData = async () => {
    const rawData = readFileSync('./firebase-applet-config.json', 'utf-8');
    const config = JSON.parse(rawData);
    
    const app = initializeApp(config);
    const db = getFirestore(app, config.firestoreDatabaseId);

    const batch = writeBatch(db);

    console.log("Seeding data into Firestore...");

    // Restaurants
    const restaurants = [
        {
            id: 'rest_1',
            name: "مطعم البركة",
            coverImage: "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=800",
            logo: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=150",
            location: "شارع ديدوش مراد، الجزائر العاصمة",
            phone: "+213 550 12 34 56",
            hours: "11:00 ص - 11:00 م",
            isOpen: true,
            deliveryFee: 250,
            deliveryTime: "30-45 دقيقة",
            rating: 4.8,
            reviewCount: 342,
            adminId: "owner_1_temp",
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        },
        {
            id: 'rest_2',
            name: "بيتزا روما",
            coverImage: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=800",
            logo: "https://images.unsplash.com/photo-1590947132387-155cc02f3212?auto=format&fit=crop&w=150",
            location: "سيدي يحيى، حيدرة",
            phone: "+213 770 98 76 54",
            hours: "12:00 م - 12:00 ص",
            isOpen: true,
            deliveryFee: 300,
            deliveryTime: "20-30 دقيقة",
            rating: 4.6,
            reviewCount: 890,
            adminId: "owner_2_temp",
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        }
    ];

    restaurants.forEach(rest => {
        const ref = doc(db, 'restaurants', rest.id);
        const { id, ...data } = rest;
        batch.set(ref, data);

        // Subscription
        const subRef = doc(db, 'subscriptions', rest.id);
        batch.set(subRef, {
            restaurantId: rest.id,
            status: 'active',
            plan: 'pro',
            startDate: new Date().toISOString(),
            endDate: new Date(Date.now() + 30*24*60*60*1000).toISOString(),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
    });

    const menuItemsRest1 = [
        {
            id: 'item_1',
            category: "برغر",
            name: "برغر كلاسيك",
            description: "شريحة لحم بقري 150 جرام، جبن شيدر، طماطم، خس، صلصة المطعم الخاصة مع بطاطس مقلية.",
            price: 750,
            image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=500",
        },
        {
            id: 'item_2',
            category: "سلطات",
            name: "سلطة سيزر دجاج",
            description: "خس طازج، دجاج مشوي، صلصة سيزر، بارميزان، قطع خبز محمص.",
            price: 600,
            image: "https://images.unsplash.com/photo-1550304943-4f24f54ddde9?auto=format&fit=crop&w=500",
        }
    ];

    menuItemsRest1.forEach(item => {
        const ref = doc(db, 'restaurants', 'rest_1', 'menuItems', item.id);
        const { id, ...data } = item;
        batch.set(ref, {
            ...data,
            restaurantId: 'rest_1',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
    });

    const menuItemsRest2 = [
        {
            id: 'item_3',
            category: "بيتزا",
            name: "بيتزا مارغريتا",
            description: "عجينة إيطالية، صلصة طماطم، موزاريلا، ريحان طازج.",
            price: 800,
            image: "https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&w=500",
        }
    ];

    menuItemsRest2.forEach(item => {
        const ref = doc(db, 'restaurants', 'rest_2', 'menuItems', item.id);
        const { id, ...data } = item;
        batch.set(ref, {
            ...data,
            restaurantId: 'rest_2',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
    });

    try {
        await batch.commit();
        console.log("Data Seeded Successfully.");
    } catch (e) {
        console.error("Error seeding data:", e);
    }
}

initData();
