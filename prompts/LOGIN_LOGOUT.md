# New Login Flow

Summary: New login flow should not offer any information to the user before login and make it less easy to log out. On loading of the homepage, if there is no user logged in, they should have the entire viewport masked (nothing interactable behind mask) and prompted to login. In order to log out there should be a dedicated Settings page with Logout as an option

## Requirements
1. Remove Login/logout button from header
2. On load of the homepage, check if there is a user logged in. Based on whether or not a user is logged in, they are presented with ONE of the following options:
	- Option 1 - NO logged in user: The ENTIRE viewport (including the header) should have a semi opaque mask applied. Nothing behind the mask should be interactable (including via keyboard navigation). Centered in the viewport shoule be the current message "Please login to be finance guy" and below that should be the login/logout button. Nothin about the button should change it is just being reused. This should be the behavior for both mobile and desktop. Mask color should be different depending on theme mode (dark vs light)
	- Option 2 - No changes, if the user is logged in they will have full access to the website and should be presented with the current home page
3. Settings Page
	- Use the current settings link in the nav to navigate to /settings. This nav item should navigate to settings in BOTH mobile and desktop
	- Settings page will be in initial development and the only option for now will be to log out. Use the Login/Logout button here again. No behavior changes for Login/Logout button
4. In addition to the login/logout stuff above, I also want you to remove the banksy-app-logo from both dark and light mode in the mobile header. Instead of that logo, I want the Dashboard nav item (in both mobile and desktop) to navigate to the home page. Along with that, the homepage should now be /dashboard and be the first page the user is presented with upon loading the website for the first time
5. Setup login/logout notification messaging system
  - On successful login, show a success toast that says "Login Successful" Below that line write "Welcome to Banksy!"
  - If ANY errors are received from the login attempt present the user with and error toast that says "Something went wrong, please try to login again"
  - These should be the same on desktop and mobile
  - Both success and error toasts should have the default life
  - On login FAILURE, along with the error toast, bring focus back to the login button