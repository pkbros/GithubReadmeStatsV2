const axios = require("axios");

const GITHUB_GRAPHQL_URL = "https://api.github.com/graphql";

// GraphQL query as defined in Plan.md
const STATS_QUERY = `
    query($username: String!) {
      user(login: $username) {
        name
        login
        bio
        company
        location
        createdAt
        followers { totalCount }
        following { totalCount }
        pullRequests { totalCount }
        issues { totalCount }
        repositories(first: 100, ownerAffiliations: [OWNER], orderBy: {field: STARGAZERS, direction: DESC}) {
          totalCount
          nodes {
            stargazerCount
            forkCount
            languages(first: 10, orderBy: {field: SIZE, direction: DESC}) {
                  edges {
                    size
                    node { name color }
                  }
                }
          }
        }
        contributionsCollection {
          totalCommitContributions
          totalPullRequestReviewContributions
          contributionCalendar {
            weeks {
              contributionDays {
                contributionCount
                date
              }
            }
          }
        }
      }
    }
    `;

/**
 * Calculates current and longest streaks from the contribution calendar
 */
function calculateStreaks(weeks) {
  // Flatten weeks into a single array of days sorted by date ascending
  const days = weeks
    .flatMap((w) => w.contributionDays)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;

  // Calculate longest streak
  for (const day of days) {
    if (day.contributionCount > 0) {
      tempStreak++;
      if (tempStreak > longestStreak) {
        longestStreak = tempStreak;
      }
    } else {
      tempStreak = 0;
    }
  }

  // Calculate current streak
  // Look backwards from the end of the array (most recent days)
  const today = new Date().toISOString().split("T")[0];
  let todayIndex = days.findIndex((d) => d.date === today);

  // If today is not in the list (e.g. timezone mismatch), default to thelast day
  if (todayIndex === -1) {
    todayIndex = days.length - 1;
  }

  // Check if today or yesterday has contributions to see if current streakis active
  let isStreakActive = false;
  let startIndex = todayIndex;

  if (days[todayIndex] && days[todayIndex].contributionCount > 0) {
    isStreakActive = true;
  } else if (
    days[todayIndex - 1] &&
    days[todayIndex - 1].contributionCount > 0
  ) {
    isStreakActive = true;
    startIndex = todayIndex - 1; // Start counting from yesterday
  }

  if (isStreakActive) {
    for (let i = startIndex; i >= 0; i--) {
      if (days[i].contributionCount > 0) {
        currentStreak++;
      } else {
        break; // Streak broken
      }
    }
  }

  return { currentStreak, longestStreak };
}

/**
 * Aggregates top languages across all repositories
 */
function aggregateLanguages(repos) {
  const langMap = {};
  let totalSize = 0;

  repos.forEach((repo) => {
    if (!repo.languages || !repo.languages.edges) return;
    repo.languages.edges.forEach((edge) => {
      const name = edge.node.name;
      const color = edge.node.color || "#cccccc";
      const size = edge.size;

      if (!langMap[name]) {
        langMap[name] = { name, color, size: 0 };
      }
      langMap[name].size += size;
      totalSize += size;
    });
  });

  if (totalSize === 0) return [];

  // Convert to array, sort by size descending, pick top 5
  return Object.values(langMap)
    .sort((a, b) => b.size - a.size)
    .slice(0, 5)
    .map((lang) => ({
      name: lang.name,
      color: lang.color,
      pct: (lang.size / totalSize) * 100,
    }));
}

/**
 * Fetches stats from GitHub GraphQL API and post-processes them
 */
async function fetchGithubStats(username) {
  const token = process.env.GITHUB_PAT;
  if (!token) {
    throw new Error("GITHUB_PAT environment variable is not defined.");
  }

  try {
    const response = await axios.post(
      GITHUB_GRAPHQL_URL,
      { query: STATS_QUERY, variables: { username } },
      {
        headers: {
          Authorization: `bearer ${token}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (response.data.errors) {
      throw new Error(response.data.errors[0].message);
    }

    const userData = response.data.data.user;
    if (!userData) {
      throw new Error("User not found.");
    }

    // 1. Core user metadata
    const name = userData.name || userData.login;
    const bio = userData.bio || "";
    const company = userData.company || "";
    const location = userData.location || "";

    // Format "2019-03-24T..." to "Mar 2019"
    const createdDate = new Date(userData.createdAt);
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const createdAt = `${months[createdDate.getMonth()]} ${createdDate.getFullYear()}`;

    // 2. Stars & Forks sums
    const repos = userData.repositories.nodes || [];
    const stars = repos.reduce((sum, r) => sum + r.stargazerCount, 0);
    const forks = repos.reduce((sum, r) => sum + r.forkCount, 0);

    // 3. Languages
    const languages = aggregateLanguages(repos);

    // 4. Streaks
    const weeks = userData.contributionsCollection.contributionCalendar.weeks;
    const { currentStreak, longestStreak } = calculateStreaks(weeks);

    // Assemble the clean cached data JSON shape
    return {
      name,
      username: userData.login,
      bio,
      location,
      company,
      createdAt,
      repos: userData.repositories.totalCount,
      stars,
      forks,
      followers: userData.followers.totalCount,
      following: userData.following.totalCount,
      commits: userData.contributionsCollection.totalCommitContributions,
      prs: userData.pullRequests.totalCount,
      issues: userData.issues.totalCount,
      reviews:
        userData.contributionsCollection.totalPullRequestReviewContributions,
      longest_streak: longestStreak,
      current_streak: currentStreak,
      languages,
    };
  } catch (error) {
    console.error("Error fetching stats from GitHub API:", error.message);
    throw error;
  }
}

module.exports = { fetchGithubStats };
