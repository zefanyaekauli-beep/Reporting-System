/**
 * Get greeting based on current time
 * @param username - Optional username to include in greeting
 * @returns Greeting string in Bahasa Indonesia
 */
export function getGreeting(username?: string | null): string {
  const hour = new Date().getHours();
  let greeting: string;

  if (hour >= 5 && hour < 11) {
    greeting = "Selamat Pagi";
  } else if (hour >= 11 && hour < 15) {
    greeting = "Selamat Siang";
  } else if (hour >= 15 && hour < 19) {
    greeting = "Selamat Sore";
  } else {
    greeting = "Selamat Malam";
  }

  if (username) {
    return `${greeting}, ${username}`;
  }

  return greeting;
}

