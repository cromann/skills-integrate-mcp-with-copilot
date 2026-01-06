document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  
  // Authentication elements
  const loginBtn = document.getElementById("login-btn");
  const loginModal = document.getElementById("login-modal");
  const loginForm = document.getElementById("login-form");
  const closeBtn = document.querySelector(".close-btn");
  const userInfo = document.getElementById("user-info");
  const usernameDisplay = document.getElementById("username-display");
  const logoutBtn = document.getElementById("logout-btn");
  const loginError = document.getElementById("login-error");

  let isAuthenticated = false;

  // Check authentication status on load
  checkAuthStatus();

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft =
          details.max_participants - details.participants.length;

        // Create participants HTML with delete icons for authenticated users
        const participantsHTML =
          details.participants.length > 0
            ? `<div class="participants-section">
              <h5>Participants:</h5>
              <ul class="participants-list">
                ${details.participants
                  .map(
                    (email) =>
                      `<li><span class="participant-email">${email}</span>${isAuthenticated ? `<button class="delete-btn" data-activity="${name}" data-email="${email}">❌</button>` : ''}</li>`
                  )
                  .join("")}
              </ul>
            </div>`
            : `<p><em>No participants yet</em></p>`;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-container">
            ${participantsHTML}
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });

      // Add event listeners to delete buttons
      document.querySelectorAll(".delete-btn").forEach((button) => {
        button.addEventListener("click", handleUnregister);
      });
    } catch (error) {
      activitiesList.innerHTML =
        "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle unregister functionality
  async function handleUnregister(event) {
    const button = event.target;
    const activity = button.getAttribute("data-activity");
    const email = button.getAttribute("data-email");

    if (!isAuthenticated) {
      messageDiv.textContent = "Please login to unregister students";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      return;
    }

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/unregister?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
          credentials: "include"
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";

        // Refresh activities list to show updated participants
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to unregister. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error unregistering:", error);
    }
  }

  // Handle signup form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!isAuthenticated) {
      messageDiv.textContent = "Please login to register students";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      return;
    }

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
          credentials: "include"
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();

        // Refresh activities list to show updated participants
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Authentication functions
  async function checkAuthStatus() {
    try {
      const response = await fetch("/auth/status", {
        credentials: "include"
      });
      const data = await response.json();
      
      if (data.authenticated) {
        isAuthenticated = true;
        showUserInfo(data.username);
      } else {
        isAuthenticated = false;
        showLoginButton();
      }
      
      // Refresh activities to update delete buttons
      fetchActivities();
    } catch (error) {
      console.error("Error checking auth status:", error);
      isAuthenticated = false;
      showLoginButton();
    }
  }

  function showUserInfo(username) {
    loginBtn.classList.add("hidden");
    userInfo.classList.remove("hidden");
    usernameDisplay.textContent = `Welcome, ${username}`;
  }

  function showLoginButton() {
    loginBtn.classList.remove("hidden");
    userInfo.classList.add("hidden");
  }

  // Login button click
  loginBtn.addEventListener("click", () => {
    loginModal.classList.remove("hidden");
  });

  // Close button click
  closeBtn.addEventListener("click", () => {
    loginModal.classList.add("hidden");
    loginError.classList.add("hidden");
  });

  // Close modal when clicking outside
  window.addEventListener("click", (event) => {
    if (event.target === loginModal) {
      loginModal.classList.add("hidden");
      loginError.classList.add("hidden");
    }
  });

  // Login form submission
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    try {
      const response = await fetch("/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({ username, password })
      });

      const result = await response.json();

      if (response.ok) {
        isAuthenticated = true;
        showUserInfo(result.username);
        loginModal.classList.add("hidden");
        loginForm.reset();
        loginError.classList.add("hidden");
        
        messageDiv.textContent = "Login successful!";
        messageDiv.className = "success";
        messageDiv.classList.remove("hidden");
        
        setTimeout(() => {
          messageDiv.classList.add("hidden");
        }, 3000);
        
        // Refresh activities to show delete buttons
        fetchActivities();
      } else {
        loginError.textContent = result.detail || "Login failed";
        loginError.classList.remove("hidden");
      }
    } catch (error) {
      loginError.textContent = "Login failed. Please try again.";
      loginError.classList.remove("hidden");
      console.error("Error logging in:", error);
    }
  });

  // Logout button click
  logoutBtn.addEventListener("click", async () => {
    try {
      const response = await fetch("/logout", {
        method: "POST",
        credentials: "include"
      });

      if (response.ok) {
        isAuthenticated = false;
        showLoginButton();
        
        messageDiv.textContent = "Logged out successfully";
        messageDiv.className = "info";
        messageDiv.classList.remove("hidden");
        
        setTimeout(() => {
          messageDiv.classList.add("hidden");
        }, 3000);
        
        // Refresh activities to hide delete buttons
        fetchActivities();
      }
    } catch (error) {
      console.error("Error logging out:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
