# Photos (Pexels licence, free to use, no attribution required)

Served from the RealAdvisor image bucket (img.realadvisor.ch, imgproxy), no local copies.

| Pexels id | URL | Bucket name | Shows | Used on |
| --- | --- | --- | --- | --- |
| 36803753 | https://www.pexels.com/photo/36803753/ | `sites-demo-pexels-36803753.jpg` | Houses on the slope of the right (east) shore of Lake Zurich, sailing boats, the Alps behind. Pexels location: Zürich. No faces, no logos. | `/orte/kuesnacht` hero, Küsnacht card on the home page ("Wo wir zu Hause sind"), `/verkaufen` hero |

The bucket holds the uncropped original (2268 x 4032, portrait). `src/lib/photo.ts` crops it with imgproxy
to a square (Alps, lake, houses): top 24 %, full width, height 56.25 %.

Note: Pexels has no photo tagged Küsnacht. This one is the right-shore character the page
describes (villas on the slope with a view over the lake); the alt text does not claim it is Küsnacht.
