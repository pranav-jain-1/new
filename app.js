// Application State
let currentUser = null;
let currentPage = "login";
let carbonData = {
  travel: { carMiles: 0, flights: 0, publicTransport: 0 },
  electricity: { kwhUsage: 0, energySource: "grid" },
  waste: { wasteKg: 0, recyclingRate: 0 },
  food: { meatMeals: 0, dairyServings: 0, localFood: 0 },
};
let userStats = {
  level: 1,
  points: 0,
  badges: [],
  totalEmissions: 0,
};

// Carbon Emission Factors (kg CO2 per unit)
const emissionFactors = {
  travel: {
    carMiles: 0.404, // kg CO2 per mile
    flights: 90, // kg CO2 per flight (average short-haul)
    publicTransport: 0.04, // kg CO2 per hour
  },
  electricity: {
    grid: 0.5, // kg CO2 per kWh (grid average)
    renewable: 0.1,
    coal: 0.9,
    "natural-gas": 0.4,
  },
  waste: {
    base: 0.5, // kg CO2 per kg waste
    recyclingReduction: 0.7, // reduction factor for recycling
  },
  food: {
    meatMeals: 6.5, // kg CO2 per meat meal
    dairyServings: 1.2, // kg CO2 per dairy serving
    localFoodReduction: 0.8, // reduction factor for local food
  },
};

// Initialize Application
document.addEventListener("DOMContentLoaded", function () {
  loadUserData();
  initializeEventListeners();
  showPage("login");
});

// Page Navigation
function showPage(pageName) {
  // Hide all pages
  document.querySelectorAll(".page").forEach((page) => {
    page.classList.remove("active");
  });

  // Show selected page
  const targetPage = document.getElementById(pageName + "-page");
  if (targetPage) {
    targetPage.classList.add("active");
    currentPage = pageName;
  }

  // Show/hide navbar based on login status
  const navbar = document.getElementById("navbar");
  if (currentUser && pageName !== "login" && pageName !== "register") {
    navbar.style.display = "block";
  } else {
    navbar.style.display = "none";
  }

  // Update page-specific content
  if (pageName === "dashboard") {
    updateDashboard();
  } else if (pageName === "gamification") {
    updateGamification();
  }
}

// Event Listeners
function initializeEventListeners() {
  // Login Form
  document
    .getElementById("login-form")
    .addEventListener("submit", function (e) {
      e.preventDefault();
      const email = document.getElementById("login-email").value;
      const password = document.getElementById("login-password").value;

      if (email && password) {
        currentUser = { email, name: email.split("@")[0] };
        saveUserData();
        showPage("dashboard");
      }
    });

  // Register Form
  document
    .getElementById("register-form")
    .addEventListener("submit", function (e) {
      e.preventDefault();
      const name = document.getElementById("register-name").value;
      const email = document.getElementById("register-email").value;
      const password = document.getElementById("register-password").value;

      if (name && email && password) {
        currentUser = { email, name };
        saveUserData();
        showPage("dashboard");
      }
    });

  // Data Entry Forms
  document
    .getElementById("travel-form")
    .addEventListener("submit", function (e) {
      e.preventDefault();
      carbonData.travel = {
        carMiles: parseFloat(document.getElementById("car-miles").value) || 0,
        flights: parseFloat(document.getElementById("flights").value) || 0,
        publicTransport:
          parseFloat(document.getElementById("public-transport").value) || 0,
      };
      saveUserData();
      updateDashboard();
      checkBadges();
      showNotification("Travel data updated!");
    });

  document
    .getElementById("electricity-form")
    .addEventListener("submit", function (e) {
      e.preventDefault();
      carbonData.electricity = {
        kwhUsage: parseFloat(document.getElementById("kwh-usage").value) || 0,
        energySource: document.getElementById("energy-source").value,
      };
      saveUserData();
      updateDashboard();
      checkBadges();
      showNotification("Electricity data updated!");
    });

  document
    .getElementById("waste-form")
    .addEventListener("submit", function (e) {
      e.preventDefault();
      carbonData.waste = {
        wasteKg: parseFloat(document.getElementById("waste-kg").value) || 0,
        recyclingRate:
          parseFloat(document.getElementById("recycling-rate").value) || 0,
      };
      saveUserData();
      updateDashboard();
      checkBadges();
      showNotification("Waste data updated!");
    });

  document.getElementById("food-form").addEventListener("submit", function (e) {
    e.preventDefault();
    carbonData.food = {
      meatMeals: parseFloat(document.getElementById("meat-meals").value) || 0,
      dairyServings:
        parseFloat(document.getElementById("dairy-servings").value) || 0,
      localFood: parseFloat(document.getElementById("local-food").value) || 0,
    };
    saveUserData();
    updateDashboard();
    checkBadges();
    showNotification("Food data updated!");
  });
}

// Carbon Emission Calculations
function calculateEmissions() {
  const emissions = {
    travel: 0,
    electricity: 0,
    waste: 0,
    food: 0,
    total: 0,
  };

  // Travel emissions
  emissions.travel =
    carbonData.travel.carMiles * emissionFactors.travel.carMiles +
    carbonData.travel.flights * emissionFactors.travel.flights +
    carbonData.travel.publicTransport * emissionFactors.travel.publicTransport;

  // Electricity emissions
  emissions.electricity =
    carbonData.electricity.kwhUsage *
    emissionFactors.electricity[carbonData.electricity.energySource];

  // Waste emissions
  const wasteReduction =
    (carbonData.waste.recyclingRate / 100) *
    emissionFactors.waste.recyclingReduction;
  emissions.waste =
    carbonData.waste.wasteKg *
    4.33 * // monthly waste
    emissionFactors.waste.base *
    (1 - wasteReduction);

  // Food emissions
  const localReduction =
    (carbonData.food.localFood / 100) * emissionFactors.food.localFoodReduction;
  emissions.food =
    (carbonData.food.meatMeals * 4.33 * emissionFactors.food.meatMeals + // monthly meals
      carbonData.food.dairyServings *
        4.33 *
        emissionFactors.food.dairyServings) *
    (1 - localReduction);

  emissions.total =
    emissions.travel + emissions.electricity + emissions.waste + emissions.food;

  return emissions;
}

// Dashboard Updates
function updateDashboard() {
  const emissions = calculateEmissions();

  // Update individual category displays
  document.getElementById("travel-emissions").textContent = Math.round(
    emissions.travel,
  );
  document.getElementById("electricity-emissions").textContent = Math.round(
    emissions.electricity,
  );
  document.getElementById("waste-emissions").textContent = Math.round(
    emissions.waste,
  );
  document.getElementById("food-emissions").textContent = Math.round(
    emissions.food,
  );

  // Update total emissions
  document.getElementById("total-emissions").textContent =
    `${Math.round(emissions.total)} kg CO₂`;
  userStats.totalEmissions = emissions.total;

  // Update progress bar (target: 500 kg CO₂/month)
  const progressPercentage = Math.min((emissions.total / 500) * 100, 100);
  document.getElementById("progress-fill").style.width =
    progressPercentage + "%";

  // Update form fields with current data
  updateFormFields();
}

function updateFormFields() {
  // Travel form
  document.getElementById("car-miles").value = carbonData.travel.carMiles || "";
  document.getElementById("flights").value = carbonData.travel.flights || "";
  document.getElementById("public-transport").value =
    carbonData.travel.publicTransport || "";

  // Electricity form
  document.getElementById("kwh-usage").value =
    carbonData.electricity.kwhUsage || "";
  document.getElementById("energy-source").value =
    carbonData.electricity.energySource || "grid";

  // Waste form
  document.getElementById("waste-kg").value = carbonData.waste.wasteKg || "";
  document.getElementById("recycling-rate").value =
    carbonData.waste.recyclingRate || "";

  // Food form
  document.getElementById("meat-meals").value = carbonData.food.meatMeals || "";
  document.getElementById("dairy-servings").value =
    carbonData.food.dairyServings || "";
  document.getElementById("local-food").value = carbonData.food.localFood || "";
}

// Gamification System
function updateGamification() {
  // Update level display
  document.getElementById("user-level").textContent = userStats.level;
  document.getElementById("user-points").textContent = userStats.points;

  const nextLevelPoints = userStats.level * 100;
  document.getElementById("next-level-points").textContent = nextLevelPoints;

  // Update level progress
  const levelProgress = ((userStats.points % 100) / 100) * 100;
  document.getElementById("level-fill").style.width = levelProgress + "%";

  // Update badges
  updateBadges();

  // Update leaderboard
  document.getElementById("leaderboard-points").textContent =
    userStats.points + " pts";
  document.getElementById("leaderboard-emissions").textContent =
    Math.round(userStats.totalEmissions) + " kg CO₂";
}

function updateBadges() {
  const badges = document.querySelectorAll(".badge");
  badges.forEach((badge) => {
    const badgeType = badge.getAttribute("data-badge");
    if (userStats.badges.includes(badgeType)) {
      badge.classList.remove("locked");
      badge.classList.add("earned");
    }
  });
}

function checkBadges() {
  const newBadges = [];

  // First Entry Badge
  if (!userStats.badges.includes("first-entry") && hasAnyData()) {
    newBadges.push("first-entry");
    userStats.points += 50;
  }

  // Eco Warrior Badge
  if (
    !userStats.badges.includes("eco-warrior") &&
    userStats.totalEmissions < 400
  ) {
    newBadges.push("eco-warrior");
    userStats.points += 100;
  }

  // Green Transport Badge
  if (
    !userStats.badges.includes("green-transport") &&
    carbonData.travel.carMiles < 50 &&
    carbonData.travel.publicTransport > 10
  ) {
    newBadges.push("green-transport");
    userStats.points += 75;
  }

  // Waste Reducer Badge
  if (
    !userStats.badges.includes("waste-reducer") &&
    carbonData.waste.recyclingRate >= 80
  ) {
    newBadges.push("waste-reducer");
    userStats.points += 75;
  }

  // Consistent Tracker Badge (simplified - awarded for having all categories filled)
  if (!userStats.badges.includes("consistent-tracker") && hasAllData()) {
    newBadges.push("consistent-tracker");
    userStats.points += 150;
  }

  // Carbon Crusher Badge (simplified - awarded for total emissions under 300)
  if (
    !userStats.badges.includes("carbon-crusher") &&
    userStats.totalEmissions < 300
  ) {
    newBadges.push("carbon-crusher");
    userStats.points += 200;
  }

  // Add new badges and check for level up
  userStats.badges.push(...newBadges);
  checkLevelUp();

  // Show notifications for new badges
  newBadges.forEach((badge) => {
    showNotification(`🎉 New badge earned: ${getBadgeName(badge)}!`);
  });

  saveUserData();
}

function checkLevelUp() {
  const newLevel = Math.floor(userStats.points / 100) + 1;
  if (newLevel > userStats.level) {
    userStats.level = newLevel;
    showNotification(`🎊 Level up! You're now level ${userStats.level}!`);
  }
}

function hasAnyData() {
  return (
    carbonData.travel.carMiles > 0 ||
    carbonData.travel.flights > 0 ||
    carbonData.electricity.kwhUsage > 0 ||
    carbonData.waste.wasteKg > 0 ||
    carbonData.food.meatMeals > 0
  );
}

function hasAllData() {
  return (
    carbonData.travel.carMiles >= 0 &&
    carbonData.electricity.kwhUsage > 0 &&
    carbonData.waste.wasteKg > 0 &&
    carbonData.food.meatMeals >= 0
  );
}

function getBadgeName(badgeType) {
  const badgeNames = {
    "first-entry": "First Entry",
    "eco-warrior": "Eco Warrior",
    "green-transport": "Green Transport",
    "waste-reducer": "Waste Reducer",
    "consistent-tracker": "Consistent Tracker",
    "carbon-crusher": "Carbon Crusher",
  };
  return badgeNames[badgeType] || badgeType;
}

// Notifications
function showNotification(message) {
  // Create notification element
  const notification = document.createElement("div");
  notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #4CAF50;
        color: white;
        padding: 15px 20px;
        border-radius: 10px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        z-index: 10000;
        font-weight: 500;
        max-width: 300px;
        word-wrap: break-word;
        opacity: 0;
        transform: translateX(100%);
        transition: all 0.3s ease;
    `;
  notification.textContent = message;

  // Add to page
  document.body.appendChild(notification);

  // Animate in
  setTimeout(() => {
    notification.style.opacity = "1";
    notification.style.transform = "translateX(0)";
  }, 100);

  // Remove after delay
  setTimeout(() => {
    notification.style.opacity = "0";
    notification.style.transform = "translateX(100%)";
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 300);
  }, 3000);
}

// Data Persistence
function saveUserData() {
  const userData = {
    currentUser,
    carbonData,
    userStats,
  };
  localStorage.setItem("ecoTracker", JSON.stringify(userData));
}

function loadUserData() {
  const saved = localStorage.getItem("ecoTracker");
  if (saved) {
    const userData = JSON.parse(saved);
    currentUser = userData.currentUser;
    carbonData = userData.carbonData || carbonData;
    userStats = userData.userStats || userStats;

    if (currentUser) {
      showPage("dashboard");
    }
  }
}

// Logout
function logout() {
  currentUser = null;
  localStorage.removeItem("ecoTracker");
  carbonData = {
    travel: { carMiles: 0, flights: 0, publicTransport: 0 },
    electricity: { kwhUsage: 0, energySource: "grid" },
    waste: { wasteKg: 0, recyclingRate: 0 },
    food: { meatMeals: 0, dairyServings: 0, localFood: 0 },
  };
  userStats = {
    level: 1,
    points: 0,
    badges: [],
    totalEmissions: 0,
  };
  showPage("login");
}
