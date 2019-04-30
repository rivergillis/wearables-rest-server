# API Documentation
Available at [this Google Doc](https://docs.google.com/document/d/1LBc_weZrheVQjammVSa00kz9_PIPeiuvVhea7RDrNAU/edit?usp=sharing).  

# Build Instructions
Install NodeJS  

Create a `.env` file in the root dir with keys MONGO_ADMIN_USERNAME, MONGO_ADMIN_PASSWORD, JWT_KEY, ADMIN_KEY
  
Update the dependencies with `npm install`

Launch dev server with `npm run dev`  

Build for production with `npm run build`  

Launch production server with `npm start`

Deploy with `npm run build && gcloud app deploy`  

Find the URL with `gcloud app browse`