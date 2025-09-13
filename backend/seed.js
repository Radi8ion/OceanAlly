// seed.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

// --- Define your Report Schema ---
// I've adapted your schema slightly to properly handle GeoJSON location data,
// which is standard for mapping applications.
const ReportSchema = new mongoose.Schema({
    reporter: { type: mongoose.Schema.Types.ObjectId, default: () => new mongoose.Types.ObjectId() },
    reporterName: { type: String, required: true },
    reporterContact: { type: String },
    hazardType: { type: String, enum: ['tsunami', 'oil_spill', 'illegal_fishing', 'marine_debris', 'other'], required: true },
    severity: { type: String, enum: ['low', 'medium', 'high'], required: true },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            required: true,
            default: 'Point'
        },
        coordinates: {
            type: [Number], // [longitude, latitude]
            required: true
        },
        locationDescription: { type: String }
    },
    description: { type: String },
    mediaUrl: { type: String },
    mediaPublicId: { type: String },
    isEmergency: { type: Boolean, default: false },
    status: { type: String, enum: ['pending', 'verified', 'resolved'], default: 'verified' },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, default: () => new mongoose.Types.ObjectId() }
}, {
    timestamps: true
});

// Create the model
const Report = mongoose.model('Report', ReportSchema);


// --- Helper function to generate reports for a cluster ---

/**
 * Generates an array of report documents centered around a specific point.
 * @param {object} options - The options for generating reports.
 * @param {number[]} options.center - The center coordinates as [latitude, longitude].
 * @param {number} options.count - The number of reports to generate.
 * @param {string} options.severity - The severity level ('high', 'medium', 'low').
 * @param {string} options.hazardType - The type of hazard.
 * @param {string} options.locationDesc - The description for the location.
 * @returns {Array} - An array of report documents.
 */
const generateReportsForCluster = ({ center, count, severity, hazardType, locationDesc }) => {
    const reports = [];
    const [lat, lng] = center;
    const clusterSpread = 0.05; // Determines how spread out the reports are. Smaller number = tighter cluster.

    for (let i = 0; i < count; i++) {
        // Generate a random offset to create a cluster effect
        const randomLat = lat + (Math.random() - 0.5) * clusterSpread;
        const randomLng = lng + (Math.random() - 0.5) * clusterSpread;

        reports.push({
            reporterName: `Demo Reporter ${i + 1}`,
            reporterContact: `91987654321${i}`,
            hazardType,
            severity,
            location: {
                type: 'Point',
                coordinates: [randomLng, randomLat], // IMPORTANT: GeoJSON is [longitude, latitude]
                locationDescription: locationDesc,
            },
            description: `This is a sample report for a ${severity} severity ${hazardType} event.`,
            mediaUrl: "https://res.cloudinary.com/dftyjbit8/image/upload/v1757652063/ocean_reports/awejsjzahmgc0vhgl5cd",
            mediaPublicId: "ocean_reports/awejsjzahmgc0vhgl5cd",
            isEmergency: severity === 'high',
            status: 'verified',
        });
    }
    return reports;
}


// --- Main Seeding Function ---
const seedDatabase = async () => {
    try {
        const mongoURI = process.env.MONGO_URI;
        if (!mongoURI) {
            throw new Error("MONGO_URI is not defined in the .env file.");
        }

        await mongoose.connect(mongoURI);
        console.log("MongoDB connected successfully.");

        // 1. Clear existing data
        console.log("Deleting all existing reports...");
        await Report.deleteMany({});
        console.log("Reports deleted.");

        // 2. Define cluster centers (along the Odisha coast)
        const highDensityCenter = {
            name: "Puri Beach",
            coords: [19.8049, 85.8293] // [lat, lng]
        };
        const mediumDensityCenter = {
            name: "Gopalpur Sea Beach",
            coords: [19.2642, 84.8943]
        };
        const lowDensityCenter = {
            name: "Chandipur Beach",
            coords: [21.4699, 87.0201]
        };

        // 3. Generate reports for each cluster
        console.log("Generating new report data...");
        const highReports = generateReportsForCluster({
            center: highDensityCenter.coords,
            count: 60, // High number of reports
            severity: 'high',
            hazardType: 'tsunami',
            locationDesc: highDensityCenter.name
        });

        const mediumReports = generateReportsForCluster({
            center: mediumDensityCenter.coords,
            count: 25, // Medium number of reports
            severity: 'medium',
            hazardType: 'marine_debris',
            locationDesc: mediumDensityCenter.name
        });

        const lowReports = generateReportsForCluster({
            center: lowDensityCenter.coords,
            count: 8, // Low number of reports
            severity: 'low',
            hazardType: 'illegal_fishing',
            locationDesc: lowDensityCenter.name
        });

        const allReports = [...highReports, ...mediumReports, ...lowReports];

        // 4. Insert the new data into the database
        console.log(`Inserting ${allReports.length} new reports...`);
        await Report.insertMany(allReports);
        console.log("✅ Database has been seeded successfully!");

    } catch (error) {
        console.error("❌ Error seeding the database:", error);
    } finally {
        // 5. Disconnect from the database
        await mongoose.disconnect();
        console.log("MongoDB disconnected.");
    }
};

// Run the seeder
seedDatabase();