import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { env } from "../../src/config/env.js";
import { connectDatabase, disconnectDatabase } from "../../src/config/database.js";
import { User } from "../../src/models/User.js";
import { SafetyReport } from "../../src/models/SafetyReport.js";
import { Analysis } from "../../src/models/Analysis.js";
import { LifeSavingRule } from "../../src/models/LifeSavingRule.js";
import { Pattern } from "../../src/models/Pattern.js";
import { Alert } from "../../src/models/Alert.js";
import { AuditTrail } from "../../src/models/AuditTrail.js";
import { Simulation } from "../../src/models/Simulation.js";
import { CopilotSession } from "../../src/models/CopilotSession.js";
import { IOGP_LIFE_SAVING_RULES } from "../../src/constants/lifeSavingRules.constants.js";
import { ExtractionService } from "../../src/services/nlp/ExtractionService.js";
import { PatternDetectionService } from "../../src/services/pattern/PatternDetectionService.js";
import { AlertService } from "../../src/services/alerts/AlertService.js";
import { logger } from "../../src/utils/logger.js";

const SEED_USERS = [
  {
    name: "System Administrator",
    email: "admin@safety.org",
    password: "AdminPassword123!",
    role: "ADMIN",
  },
  {
    name: "Lead HSE Officer",
    email: "hse.officer@safety.org",
    password: "OfficerPassword123!",
    role: "HSE_OFFICER",
  },
  {
    name: "Senior Safety Reviewer",
    email: "reviewer@safety.org",
    password: "ReviewerPassword123!",
    role: "REVIEWER",
  },
  {
    name: "Operational Viewer",
    email: "viewer@safety.org",
    password: "ViewerPassword123!",
    role: "VIEWER",
  },
];

const SEED_INCIDENTS = [
  {
    reportId: "INC-2026-001",
    title: "Unsecured Scaffolding Planks at 8m Elevation",
    description: "During structural painting on offshore Module B at 8.2 meters elevation, an unclipped scaffolding plank shifted when stepped on. The technician slipped and fell, but their dual-lanyard harness deployed. Two loose scaffolding clamps fell 8m to the deck below, narrowly missing workers.",
    site: "Offshore Platform Alpha",
    eventDate: new Date("2026-01-14T09:30:00Z"),
    reporterName: "Marcus Vance",
  },
  {
    reportId: "INC-2026-002",
    title: "440V Motor Control Center Arc Flash Near Miss",
    description: "An electrician opened a 440V Motor Control Center (MCC) switchboard panel without applying Lockout/Tagout (LOTO) or verifying zero electrical energy. A loose test probe made contact with busbars, causing an intense electrical arc flash that scorched the cabinet door.",
    site: "Refinery Unit 4",
    eventDate: new Date("2026-01-18T14:15:00Z"),
    reporterName: "Elena Rostova",
  },
  {
    reportId: "INC-2026-003",
    title: "Toxic H2S Gas Pocket Breakthrough During Line Breaking",
    description: "During scheduled maintenance on crude desalter separator unit, pipefitters unbolted a 6-inch flange without full atmospheric gas testing. A trapped pocket of hydrogen sulfide (H2S) at 120 ppm was released. Fixed area detectors triggered evacuation alarms.",
    site: "Refinery Unit 4",
    eventDate: new Date("2026-01-22T11:00:00Z"),
    reporterName: "Tariq Al-Mansoor",
  },
  {
    reportId: "INC-2026-004",
    title: "Suspended 4-Ton Heat Exchanger Swing Over Walkway",
    description: "A 4-ton tubular heat exchanger bundle was hoisted by mobile crane across a designated pedestrian walkway. The secondary guide tag-line snapped under wind gust, allowing the suspended load to swing within 1.5 meters of operators who were not excluded by hard barricading.",
    site: "Chemical Terminal B",
    eventDate: new Date("2026-02-02T16:45:00Z"),
    reporterName: "David Chen",
  },
  {
    reportId: "INC-2026-005",
    title: "Unauthorized Entry into Nitrogen-Purged Reactor Vessel",
    description: "Contractor technician entered the top manway of Nitrogen-purged Reactor R-302 to retrieve a dropped wrench before obtaining a Confined Space Entry permit or verifying continuous oxygen air monitoring. The atmosphere was 14% O2.",
    site: "Petrochemical Complex Gamma",
    eventDate: new Date("2026-02-10T08:20:00Z"),
    reporterName: "Sarah Jenkins",
  },
  {
    reportId: "INC-2026-006",
    title: "Excavation Wall Collapse in 3.5m Trench",
    description: "While laying 12-inch cooling water lines in a 3.5-meter deep trench, heavy rain undermined the east trench wall. Soil collapsed into the work trench. Shoring boxes were only installed on the north section.",
    site: "Pipeline Sector 9",
    eventDate: new Date("2026-02-15T13:10:00Z"),
    reporterName: "Carlos Ramirez",
  },
  {
    reportId: "INC-2026-007",
    title: "High Pressure Hydraulic Line Rupture at 3000 PSI",
    description: "A high-pressure hydraulic hose on a deck crane ruptured at 3,000 PSI during dynamic lifting operations. Hydraulic fluid mist sprayed across hot exhaust manifolds, creating fire hazard.",
    site: "Offshore Platform Alpha",
    eventDate: new Date("2026-02-20T10:05:00Z"),
    reporterName: "Marcus Vance",
  },
  {
    reportId: "INC-2026-008",
    title: "Forklift Reversing Blind Near Loading Dock",
    description: "A 5-ton forklift carrying double-stacked pallets reversed out of warehouse bay into main traffic lane without audible backup alarm or pedestrian spotter.",
    site: "Logistics Hub East",
    eventDate: new Date("2026-02-25T15:30:00Z"),
    reporterName: "Priya Sharma",
  },
  {
    reportId: "INC-2026-009",
    title: "Hot Work Sparks Igniting Oily Rags Near Fuel Tank",
    description: "Angle grinding sparks from pipe cutting landed on an open waste bin containing diesel-soaked rags located 4 meters from flammable solvent storage tank. Fire watch extinguished flames.",
    site: "Refinery Unit 4",
    eventDate: new Date("2026-03-01T11:40:00Z"),
    reporterName: "Elena Rostova",
  },
  {
    reportId: "INC-2026-010",
    title: "Man-Basket Hoist Wire Rope Strand Damage",
    description: "Pre-use inspection of crane man-basket wire rope revealed 3 broken strands and severe crimping near the thimble eye. The crane was scheduled for personnel transfer to platform flare tip at 65m elevation.",
    site: "Offshore Platform Alpha",
    eventDate: new Date("2026-03-05T07:15:00Z"),
    reporterName: "Marcus Vance",
  },
  {
    reportId: "INC-2026-011",
    title: "Minor Coffee Spill in Control Room",
    description: "Operator spilled coffee on control desk surface. Cleaned immediately with paper towels. No equipment contact or electrical damage.",
    site: "Refinery Unit 4",
    eventDate: new Date("2026-03-07T08:00:00Z"),
    reporterName: "Elena Rostova",
  },
  {
    reportId: "INC-2026-012",
    title: "Unlabeled Solvent Container on Workstation",
    description: "A 1-liter secondary plastic bottle containing degreaser was left unlabeled on workbench in mechanical workshop.",
    site: "Chemical Terminal B",
    eventDate: new Date("2026-03-09T14:00:00Z"),
    reporterName: "David Chen",
  },
  {
    reportId: "INC-2026-013",
    title: "Overhead Crane Limit Switch Bypassed",
    description: "During heavy valve maintenance, overhead gantry crane upper travel limit switch was found mechanically bypassed with wire tie, allowing hook block to strike top drum.",
    site: "Chemical Terminal B",
    eventDate: new Date("2026-03-12T16:20:00Z"),
    reporterName: "David Chen",
  },
  {
    reportId: "INC-2026-014",
    title: "Radiation Source Gauge Left Unshielded",
    description: "Industrial radiography team completed pipe weld testing and failed to fully retract the Iridium-192 radioactive isotope source into shielded transport container before leaving area.",
    site: "Pipeline Sector 9",
    eventDate: new Date("2026-03-15T18:30:00Z"),
    reporterName: "Carlos Ramirez",
  },
  {
    reportId: "INC-2026-015",
    title: "Hydrocarbon Gas Venting During Blind Flange Removal",
    description: "Operators cracked bolts on fuel gas meter run blind flange before verifying upstream double block and bleed isolation was depressurized. Residual gas hissed out at 45 PSI.",
    site: "Refinery Unit 4",
    eventDate: new Date("2026-03-18T10:15:00Z"),
    reporterName: "Elena Rostova",
  },
  {
    reportId: "INC-2026-016",
    title: "Damaged Step on Mobile Staircase",
    description: "Bottom rubber tread on portable staircase was torn, creating 2cm trip hazard. Repaired within 2 hours.",
    site: "Logistics Hub East",
    eventDate: new Date("2026-03-20T09:00:00Z"),
    reporterName: "Priya Sharma",
  },
  {
    reportId: "INC-2026-017",
    title: "Fall from 12m Scaffold During Storm Wind Gust",
    description: "Insulation contractor working on flare header at 12m height unhooked full-body harness lanyard to move around scaffold leg during 35-knot wind gust. Scaffold guardrail was missing mid-rail.",
    site: "Offshore Platform Alpha",
    eventDate: new Date("2026-03-22T13:45:00Z"),
    reporterName: "Marcus Vance",
  },
  {
    reportId: "INC-2026-018",
    title: "High Voltage Transformer Cable Trench Water Inundation",
    description: "Substation 13.8kV underground cable trench was submerged under 1 meter of rainwater following pump failure, with live terminations exposed to moisture ingress.",
    site: "Petrochemical Complex Gamma",
    eventDate: new Date("2026-03-25T11:20:00Z"),
    reporterName: "Sarah Jenkins",
  },
  {
    reportId: "INC-2026-019",
    title: "Pressure Relief Valve Gagged During Hydrotest",
    description: "Following hydrostatic pressure testing of propane accumulator drum, maintenance crew failed to remove the test gag pin from the main safety pressure relief valve (PSV).",
    site: "Refinery Unit 4",
    eventDate: new Date("2026-03-28T15:00:00Z"),
    reporterName: "Elena Rostova",
  },
  {
    reportId: "INC-2026-020",
    title: "Chemical Spill of 200L Caustic Soda",
    description: "Transfer hose disconnected from IBC tote container during pump-down, discharging 200 liters of 50% Sodium Hydroxide onto concrete containment bund.",
    site: "Chemical Terminal B",
    eventDate: new Date("2026-04-02T10:30:00Z"),
    reporterName: "David Chen",
  },
  {
    reportId: "INC-2026-021",
    title: "Heavy Haul Transport Truck Rollover on Access Road",
    description: "Articulated flatbed truck carrying 30-ton compressor skid lost traction on muddy bend along unpaved mountain access road. Trailer rolled onto 45-degree embankment.",
    site: "Pipeline Sector 9",
    eventDate: new Date("2026-04-06T08:50:00Z"),
    reporterName: "Carlos Ramirez",
  },
  {
    reportId: "INC-2026-022",
    title: "Confined Space Sludge Removal Without Standby Rescuer",
    description: "Two workers entered underground oil-water separator sump to shovel hydrocarbon sludge without a dedicated entry watch/standby rescuer stationed at top.",
    site: "Chemical Terminal B",
    eventDate: new Date("2026-04-10T14:10:00Z"),
    reporterName: "David Chen",
  },
  {
    reportId: "INC-2026-023",
    title: "Crane Boom Strike on Live Pipe Rack",
    description: "50-ton hydraulic mobile crane swung its lattice boom into top tier of live high-pressure steam pipe rack while slewing without banksman.",
    site: "Refinery Unit 4",
    eventDate: new Date("2026-04-15T16:00:00Z"),
    reporterName: "Elena Rostova",
  },
  {
    reportId: "INC-2026-024",
    title: "Dropped 15kg Shackle from Derrick Crown at 45m",
    description: "During drilling rig derrick inspection at 45m elevation, a 15kg steel rigging shackle slipped from technician's hands and dropped onto the drill floor below.",
    site: "Offshore Platform Alpha",
    eventDate: new Date("2026-04-18T11:15:00Z"),
    reporterName: "Marcus Vance",
  },
  {
    reportId: "INC-2026-025",
    title: "Burn Injury from Flash Steam Release",
    description: "Operator opened condensate drain valve on 150 PSI steam trap without wearing face shield or thermal gloves, receiving second-degree steam scalding to forearm.",
    site: "Petrochemical Complex Gamma",
    eventDate: new Date("2026-04-22T09:40:00Z"),
    reporterName: "Sarah Jenkins",
  },
];

export async function runMasterSeed() {
  try {
    logger.info("=================================================");
    logger.info("🌱 INITIATING SIH 2026 MASTER HSE SEED PIPELINE");
    logger.info("=================================================");

    await connectDatabase();

    // 1. Seed Users
    logger.info("Seeding Default RBAC Users...");
    for (const userData of SEED_USERS) {
      const existingUser = await User.findOne({ email: userData.email });
      if (!existingUser) {
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        await User.create({
          ...userData,
          password: hashedPassword,
        });
        logger.info(`✓ Seeded User: ${userData.email} (${userData.role})`);
      }
    }

    // 2. Seed 9 Official IOGP Life-Saving Rules
    logger.info("Seeding Official IOGP Report 459 Life-Saving Rules...");
    for (const rule of IOGP_LIFE_SAVING_RULES) {
      await LifeSavingRule.findOneAndUpdate(
        { ruleId: rule.ruleId },
        { $set: rule },
        { upsert: true, new: true }
      );
    }
    logger.info(`✓ Seeded 9 Official IOGP Life-Saving Rules`);

    // 3. Seed and Ingest 25+ Incident Reports with Full Analysis Pipeline
    logger.info(`Ingesting and Analyzing ${SEED_INCIDENTS.length} Realistic HSE Incidents...`);

    for (const inc of SEED_INCIDENTS) {
      let report = await SafetyReport.findOne({ reportId: inc.reportId });
      if (!report) {
        report = new SafetyReport({
          reportId: inc.reportId,
          originalContent: inc.description,
          sourceType: "RAW_TEXT",
          contentHash: "hash_" + inc.reportId,
          normalizedReport: {
            title: inc.title,
            description: inc.description,
            eventDate: inc.eventDate,
            site: inc.site,
            reporterName: inc.reporterName,
            activity: "Industrial Task",
            severityRating: "HIGH",
          },
          ingestionStatus: "COMPLETED",
          reviewStatus: "PENDING_REVIEW",
        });
        await report.save();
      }

      // Execute AI NLP Analysis & Vector Pipeline
      try {
        const analysis = await ExtractionService.extractAndPersist(report);
        await AlertService.evaluateReportAlerts(report, analysis);
        logger.info(`✓ Ingested & Analyzed: ${inc.reportId} ➔ SIF: ${analysis.sifClassification.classification} (Score: ${analysis.riskScore.score})`);
      } catch (err) {
        logger.warn(`Could not run full extraction for ${inc.reportId}: ${err.message}`);
      }
    }

    // 4. Run Pattern Mining
    logger.info("Mining Recurring Multidimensional Pattern Clusters...");
    const patterns = await PatternDetectionService.mineRecurringPatterns();
    logger.info(`✓ Discovered ${patterns.length} Active Recurring Safety Patterns`);

    logger.info("=================================================");
    logger.info("✅ MASTER SEED PIPELINE COMPLETED SUCCESSFULLY");
    logger.info("=================================================");
  } catch (error) {
    logger.error(`Master seed pipeline failed: ${error.message}`);
  } finally {
    await disconnectDatabase();
  }
}

// Allow direct CLI execution
if (process.argv[1]?.endsWith("masterSeed.js")) {
  runMasterSeed().then(() => process.exit(0));
}

export default runMasterSeed;
