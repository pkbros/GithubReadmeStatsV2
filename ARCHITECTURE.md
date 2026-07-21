# Architecture

GithubReadmeStatsV2 is a full-stack application designed to fetch and display GitHub statistics. It is composed of three main modules: Frontend, Backend, and Database.

## Tech Stack
- **Frontend**: React, React Router, Vite, Tailwind CSS, DaisyUI. Deployed on Firebase Hosting.
- **Backend**: Node.js, Express.js. Uses Axios for external API requests (GitHub API) and Supabase client for database interaction.
- **Database**: Supabase (PostgreSQL) used for data caching.

## Data Flow
1. **Client Request**: The user accesses the application through the Frontend (React application).
2. **API Call**: The Frontend makes a request to the Backend (Express.js API) to fetch GitHub statistics for a specific user.
3. **Cache Check**: 
   - The Backend queries the Supabase Database (`github_cache` table) to check if the requested user's data is already cached and up-to-date.
4. **GitHub API Request**: 
   - If the cache is missing or expired, the Backend makes an external API call to the GitHub API using Axios.
5. **Cache Update**:
   - The Backend stores the newly fetched data into the Supabase Database to improve performance for subsequent requests.
6. **Response**: The Backend returns the formatted statistics data to the Frontend, which then renders the visual statistics for the user.

## Directory Structure
- `/frontend`: Contains the Vite + React source code, UI components, and Firebase configuration.
- `/backend`: Contains the Node.js API server code, routes, controllers, and Supabase client setup.
- `/database`: Contains the `schema.sql` file used for setting up the PostgreSQL cache table in Supabase.
