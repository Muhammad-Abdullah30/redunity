export const locationData = {
  Pakistan: [
    "Abbottabad", "Ahmedpur East", "Attock", "Badin", "Bahawalnagar", "Bahawalpur",
    "Bhakkar", "Burewala", "Chakwal", "Chaman", "Charsadda", "Chiniot", "Chishtian",
    "Dadu", "Daska", "Dera Ghazi Khan", "Dera Ismail Khan", "Faisalabad", "Ferozwala",
    "Gojra", "Gujranwala", "Gujranwala Cantonment", "Gujrat", "Hafizabad", "Hasilpur",
    "Hub", "Hyderabad", "Islamabad", "Jacobabad", "Jaranwala", "Jhang", "Jhelum",
    "Kabal", "Kamalia", "Kamoke", "Karachi", "Kasur", "Khairpur", "Khanewal", "Khanpur",
    "Khushab", "Khuzdar", "Kohat", "Kot Abdul Malik", "Kot Addu", "Kotri", "Lahore",
    "Larkana", "Layyah", "Lodhran", "Mandi Bahauddin", "Mansehra", "Mardan", "Mianwali",
    "Mingora", "Mirpur", "Mirpur Khas", "Multan", "Muridke", "Muzaffarabad", "Muzaffargarh",
    "Nawabshah", "Nowshera", "Okara", "Pakpattan", "Peshawar", "Quetta", "Rahim Yar Khan",
    "Rawalpindi", "Sadiqabad", "Sahiwal", "Samundri", "Sargodha", "Shahdadkot", "Sheikhupura",
    "Shikarpur", "Sialkot", "Sukkur", "Swabi", "Tando Adam", "Tando Allahyar", "Taxila",
    "Turbat", "Umerkot", "Vehari", "Wah Cantt", "Wazirabad"
  ],
  India: [
    "Mumbai", "Delhi", "Bangalore", "Hyderabad", "Ahmedabad", "Chennai", "Kolkata",
    "Pune", "Jaipur", "Surat"
  ],
  Germany: [
    "Berlin", "Hamburg", "Munich", "Cologne", "Frankfurt", "Stuttgart", "Düsseldorf",
    "Dortmund", "Essen", "Leipzig"
  ],
  Korea: [
    "Seoul", "Busan", "Incheon", "Daegu", "Daejeon", "Gwangju", "Suwon", "Ulsan",
    "Changwon", "Cheongju"
  ],
  France: [
    "Paris", "Marseille", "Lyon", "Toulouse", "Nice", "Nantes", "Strasbourg",
    "Montpellier", "Bordeaux", "Lille"
  ],
  "United States of America": [
    "New York", "Los Angeles", "Chicago", "Houston", "Phoenix", "Philadelphia",
    "San Antonio", "San Diego", "Dallas", "San Jose"
  ],
  "United Kingdom": [
    "London", "Birmingham", "Manchester", "Glasgow", "Liverpool", "Bristol",
    "Edinburgh", "Leeds", "Sheffield", "Newcastle"
  ],
  Canada: [
    "Toronto", "Montreal", "Vancouver", "Calgary", "Edmonton", "Ottawa", "Winnipeg",
    "Quebec City", "Hamilton", "Kitchener"
  ],
  "United Arab Emirates": [
    "Dubai", "Abu Dhabi", "Sharjah", "Al Ain", "Ajman", "Ras Al Khaimah",
    "Fujairah", "Umm Al Quwain"
  ]
};

export const hospitalData = {
  Karachi: [
    "Aga Khan University Hospital",
    "Indus Hospital",
    "Civil Hospital Karachi",
    "Jinnah Postgraduate Medical Centre",
    "Liaquat National Hospital",
    "Ziauddin Hospital"
  ],
  Lahore: [
    "Mayo Hospital",
    "Services Hospital",
    "Shalamar Hospital",
    "Sir Ganga Ram Hospital",
    "Fatima Memorial Hospital",
    "Doctors Hospital"
  ],
  Islamabad: [
    "Pakistan Institute of Medical Sciences (PIMS)",
    "Shifa International Hospital",
    "Pakistan Atomic Energy Commission Hospital",
    "Benazir Bhutto Hospital",
    "Kulsum International Hospital"
  ],
  Rawalpindi: [
    "Rawalpindi General Hospital",
    "Benazir Bhutto Hospital",
    "Military Hospital Rawalpindi",
    "Holy Family Hospital",
    "Army Medical College"
  ],
  Faisalabad: [
    "Allied Hospital Faisalabad",
    "DHQ Hospital Faisalabad",
    "National Hospital Faisalabad",
    "Manchester Medical Center"
  ],
  Multan: [
    "Nishtar Hospital Multan",
    "Bahauddin Zakariya University Hospital",
    "CMH Multan",
    "Fatima Hospital Multan"
  ],
  Peshawar: [
    "Lady Reading Hospital",
    "Khyber Teaching Hospital",
    "Hayatabad Medical Complex",
    "Rehman Medical Institute"
  ],
  Quetta: [
    "Civil Hospital Quetta",
    "Sandeman Provincial Hospital",
    "Bolan Medical Complex",
    "Fatima Jinnah Hospital"
  ]
};

export const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export const getCitiesByCountry = (country: string): string[] => {
  return locationData[country as keyof typeof locationData] || [];
};

export const getHospitalsByCity = (city: string): string[] => {
  return hospitalData[city as keyof typeof hospitalData] || [];
};

export const getAllCountries = (): string[] => {
  return Object.keys(locationData);
};