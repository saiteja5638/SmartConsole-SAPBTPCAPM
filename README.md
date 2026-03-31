# 📦 DataImport Console

> A high-performance data import/export solution for SAP BTP sub-accounts — reducing processing time from **hours to minutes**.

---

## 🚀 Overview

**DataImport Console** is an enterprise-grade tool built on **SAP BTP CAPM** that enables seamless, high-speed data migration across sub-accounts. Whether you're importing thousands of records or exporting complex datasets, DataImport Console handles it efficiently with real-time feedback and full observability.

---

## ✨ Key Highlights

### ⚡ Streaming
- Real-time data streaming ensures data flows continuously without buffering bottlenecks
- Reduces wait time drastically — operations that previously took **hours now complete in minutes**
- Provides live progress updates to the user interface as data moves between sub-accounts

### 🧵 Workers
- Parallel worker threads handle concurrent import/export jobs simultaneously
- Optimized task distribution ensures maximum throughput and minimal idle time
- Scales efficiently with workload size, maintaining performance under heavy data loads

### 🔒 Data Masking
- Sensitive fields are automatically masked during import/export operations
- Ensures compliance with data privacy regulations (GDPR, data residency policies)
- Configurable masking rules allow teams to define what data gets obfuscated

### 📋 Error Log Monitoring
- Centralized error log dashboard for real-time monitoring of import/export jobs
- Detailed error traces with timestamps, affected records, and failure reasons
- Enables quick diagnosis and resolution without re-running entire operations

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Backend Framework | SAP BTP CAPM (Cloud Application Programming Model) |
| Runtime | Node.js / SAP CAP |
| Frontend | HTML, CSS, JavaScript |
| Data Processing | Streaming + Worker Threads |
| Platform | SAP Business Technology Platform (BTP) |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────┐
│            UI Layer                 │
│       HTML + CSS + JavaScript       │
└────────────────┬────────────────────┘
                 │
┌────────────────▼────────────────────┐
│         SAP BTP CAPM Backend        │
│  ┌──────────┐    ┌───────────────┐  │
│  │ Workers  │    │   Streaming   │  │
│  └──────────┘    └───────────────┘  │
│  ┌──────────────────────────────┐   │
│  │       Data Masking Layer     │   │
│  └──────────────────────────────┘   │
│  ┌──────────────────────────────┐   │
│  │    Error Log Monitoring      │   │
│  └──────────────────────────────┘   │
└────────────────┬────────────────────┘
                 │
┌────────────────▼────────────────────┐
│         SAP BTP Sub-Accounts        │
│   Sub-Account A  ⇄  Sub-Account B   │
└─────────────────────────────────────┘
```

---

## 📂 Project Structure

```
dataimport-console/
├── app/                    # Frontend UI (HTML, CSS, JS)
│   ├── index.html
│   ├── styles/
│   └── scripts/
├── srv/                    # CAP Service layer
│   ├── import-service.js
│   ├── export-service.js
│   └── masking-handler.js
├── db/                     # CDS Data Models
│   └── schema.cds
├── workers/                # Worker thread definitions
│   └── data-worker.js
├── logs/                   # Error log handlers
│   └── error-monitor.js
├── mta.yaml                # SAP BTP deployment descriptor
├── package.json
└── README.md
```

---

## ⚙️ Getting Started

### Prerequisites

- SAP BTP account with sub-account access
- Node.js `>= 18.x`
- SAP CAP CLI (`@sap/cds-dk`)
- Cloud Foundry CLI (for deployment)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/dataimport-console.git
cd dataimport-console

# Install dependencies
npm install

# Run locally
cds watch
```

### Deployment to SAP BTP

```bash
# Build the MTA archive
mbt build

# Deploy to Cloud Foundry
cf deploy mta_archives/dataimport-console_1.0.0.mtar
```

---

## 🔧 Configuration

Configure your sub-account connection details and masking rules in the environment or `default-env.json`:

```json
{
  "SUBACCOUNT_SOURCE": "<source-sub-account-url>",
  "SUBACCOUNT_TARGET": "<target-sub-account-url>",
  "MASKING_FIELDS": ["email", "phone", "taxId"],
  "WORKER_THREADS": 4,
  "STREAM_CHUNK_SIZE": 500
}
```

---

## 📊 Performance

| Mode | Before | After |
|---|---|---|
| Full data import | ~4–6 hours | ~10–15 minutes |
| Partial export | ~1–2 hours | ~2–5 minutes |
| Concurrent jobs | Not supported | ✅ Supported via Workers |

---

## 🔍 Error Monitoring

All import/export errors are captured and displayed in the **Error Log Monitor** panel within the UI. Each log entry includes:

- **Timestamp** of the failure
- **Job ID** and sub-account reference
- **Error type** and message
- **Affected record count**
- **Retry option** for recoverable errors

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'Add your feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

> Built with ❤️ on SAP BTP CAPM — making enterprise data migration fast, safe, and observable.
