import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '../../data/reunion.db');

const db = new Database(dbPath);

// Seed suggested events for Saugatuck, MI area
const suggestions = [
  {
    title: "Star of Saugatuck Paddlewheel Cruise",
    description: "Enjoy a relaxing 90-minute cruise on an authentic sternwheel paddleboat down the Kalamazoo River and onto Lake Michigan. Perfect for all ages with snacks and drinks available onboard. Sunset cruises are especially popular!",
    latitude: 42.6548,
    longitude: -86.2017,
    location_name: "Star of Saugatuck",
    address: "716 Water Street, Saugatuck, MI 49453",
    contact_phone: "(269) 857-4261",
    contact_email: "julieziemann@hotmail.com",
    website_url: "https://saugatuckboatcruises.com/",
    reviews_url: "https://www.tripadvisor.com/Attraction_Review-g42683-d1141646-Reviews-Star_of_Saugatuck_II-Saugatuck_Allegan_County_Michigan.html",
    image_url: "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/24/6d/f5/b7/well-maintained-boat.jpg?w=1200&h=-1&s=1"
  },
  {
    title: "Saugatuck Dunes State Park Hike",
    description: "Explore 13 miles of trails through 200-foot coastal dunes with 2.5 miles of secluded Lake Michigan beach. The Beach Trail is the shortest route at 0.75 miles one-way. Great for all skill levels with stunning lake views!",
    latitude: 42.7089,
    longitude: -86.2167,
    location_name: "Saugatuck Dunes State Park",
    address: "138th Ave & State Park Dr, Holland, MI 49423",
    contact_phone: "(269) 637-2788",
    contact_email: null,
    website_url: "https://www.michigan.gov/recsearch/parks/saugatuck",
    reviews_url: "https://www.alltrails.com/parks/us/michigan/saugatuck-dunes-state-park",
    image_url: "https://www.michigan.org/sites/default/files/listing_images/profile/12676/94e989739117bd23a2423ac473232d42_saugdunessp-sand-path.jpg"
  },
  {
    title: "Retro Boat Rentals",
    description: "Rent vintage 1958-1963 classic fiberglass runabouts with retro-fitted electric motors for a quiet, eco-friendly cruise. Also offers pontoon boats, Donut Boats for larger groups, and Duffy boats. Located at The Old Boat House bar.",
    latitude: 42.6531,
    longitude: -86.2012,
    location_name: "Retro Boat Rentals at The Old Boat House",
    address: "449 Water Street, Saugatuck, MI 49453",
    contact_phone: "(269) 455-5069",
    contact_email: null,
    website_url: "https://retroboatrentals.com/",
    reviews_url: "https://www.tripadvisor.com/Attraction_Review-g42683-d10353218-Reviews-Retro_Boat_Rentals-Saugatuck_Allegan_County_Michigan.html",
    image_url: "https://retroboatrentals.com/wp-content/uploads/sites/7263/2024/04/305314304_494010889399680_3313328448131421856_n.jpg?w=700&h=700&zoom=2"
  },
  {
    title: "Mt. Baldhead Climb",
    description: "Climb 302 stairs to the top of Mt. Baldhead for panoramic views of Saugatuck, Lake Michigan, and the Kalamazoo River. Then run down the sand dune to Oval Beach! Free activity, great exercise, and amazing photo opportunities.",
    latitude: 42.6589,
    longitude: -86.2089,
    location_name: "Mount Baldhead Park",
    address: "Park Street, Saugatuck, MI 49453",
    contact_phone: null,
    contact_email: null,
    website_url: "https://saugatuck.com/business/mount-baldhead-park/",
    reviews_url: "https://www.tripadvisor.com/Attraction_Review-g42683-d4368804-Reviews-Mount_Baldhead_Park-Saugatuck_Allegan_County_Michigan.html",
    image_url: "https://saugatuck.com/nitropack_static/fKqinUttdxiKHzEWiIkcMNGoWUXhINiu/assets/images/optimized/rev-e95c21e/saugatuck.com/wp-content/uploads/2020/07/2020-0824_Saugatuck_Mount-Baldhead_16.jpg"
  },
  {
    title: "Backyard Bonfire & S'mores Night",
    description: "Host a cozy evening around the fire pit! Make s'mores, share stories, and enjoy the Michigan summer night. Perfect for all ages. Just need firewood, marshmallows, chocolate, and graham crackers.",
    latitude: null,
    longitude: null,
    location_name: "Your rental property",
    address: null,
    contact_phone: null,
    contact_email: null,
    website_url: null,
    reviews_url: null,
    image_url: "https://www.southernliving.com/thmb/jyPzJ4PUNb8thVSg6m6uNq4h5Aw=/750x0/filters:no_upscale():max_bytes(150000):strip_icc()/Smores_002-3c1da5c63d9a41a58a1dac6603f24d36.jpg"
  },
  {
    title: "Movie Night",
    description: "Set up a projector and screen for a family movie night! Bring blankets, pillows, and popcorn. Great for winding down after a day of activities. Works indoors or outdoors under the stars.",
    latitude: null,
    longitude: null,
    location_name: "Your rental property",
    address: null,
    contact_phone: null,
    contact_email: null,
    website_url: null,
    reviews_url: null,
    image_url: "https://dlqxt4mfnxo6k.cloudfront.net/hallmarkhomesgroup.com/aHR0cHM6Ly9zMy5hbWF6b25hd3MuY29tL2J1aWxkZXJjbG91ZC82YmUwZTY2OGQ2ZjQzNDQzMWRmMzc4YjI4NzA4ZWQyYi5qcGVn/webp/800/800"
  },
  // NEW: Strawberry picking, winery, and fishing
  {
    title: "Strawberry Picking at Crane Orchards",
    description: "U-pick strawberries at this 6th-generation family farm. June is prime strawberry season in Michigan! The rolling hills are planted with precise blocks of fruit trees and berry patches. Bring your own containers or purchase bags on-site. Call the U-Pick hotline for current picking conditions.",
    latitude: 42.5847,
    longitude: -86.1089,
    location_name: "Crane Orchards",
    address: "6054 124th Ave, Fennville, MI 49408",
    contact_phone: "(269) 561-8651",
    contact_email: "info@craneorchards.com",
    website_url: "https://www.craneorchards.com",
    reviews_url: "https://www.yelp.com/biz/crane-orchards-fennville",
    image_url: "https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=800"
  },
  {
    title: "Vineyard Tour & Wine Tasting at Fenn Valley",
    description: "Tour a 240-acre working vineyard and winery established in 1973. The guided tour includes a walk through vineyards (June-October) or wine cellar, wine sampling throughout, a souvenir glass, and a glass of wine or cider at the end. Learn how the Lake Effect makes Michigan wine possible. $10 tasting flights available daily 11am-5pm.",
    latitude: 42.5583,
    longitude: -86.1272,
    location_name: "Fenn Valley Vineyards",
    address: "6130 122nd Ave, Fennville, MI 49408",
    contact_phone: "(269) 561-2396",
    contact_email: "info@fennvalley.com",
    website_url: "https://www.fennvalley.com/product-category/tours/",
    reviews_url: "https://www.tripadvisor.com/Attraction_Review-g42198-d1748271-Reviews-Fenn_Valley_Vineyards-Fennville_Allegan_County_Michigan.html",
    image_url: "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/06/0e/f7/71/fenn-valley-vineyards.jpg?w=900&h=500&s=1"
  },
  {
    title: "River Fishing with Inshore Adventures",
    description: "Light tackle bass fishing on the scenic Kalamazoo River. Perfect for families and beginners. Target largemouth bass, smallmouth bass, northern pike, and walleye. Gear provided, bring your own cooler. Michigan fishing license required (ages 17+).",
    latitude: 42.6550,
    longitude: -86.2010,
    location_name: "Inshore Adventures",
    address: "Saugatuck Harbor, Saugatuck, MI",
    contact_phone: "(616) 402-0160",
    contact_email: "daverobb74@gmail.com",
    website_url: "https://www.inshore-adventures.com",
    reviews_url: "https://www.tripadvisor.com/Attraction_Review-g42683-d26167348-Reviews-Inshore_Adventures-Saugatuck_Allegan_County_Michigan.html",
    image_url: "https://rr-blog-s3fs.s3.us-west-2.amazonaws.com/s3fs-public/inline-images/pasted%20image%200_6.png?VersionId=D7SNCW4JCTtQbBHNhoSIP_1s63bMkdtg"
  }
];

// Clear existing suggestions and insert new ones
db.prepare('DELETE FROM suggested_events').run();

const insert = db.prepare(`
  INSERT INTO suggested_events (
    title, description, latitude, longitude, location_name, address,
    contact_phone, contact_email, website_url, reviews_url, image_url
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

for (const s of suggestions) {
  insert.run(
    s.title, s.description, s.latitude, s.longitude, s.location_name, s.address,
    s.contact_phone, s.contact_email, s.website_url, s.reviews_url, s.image_url
  );
}

console.log(`Seeded ${suggestions.length} suggested events`);
db.close();
