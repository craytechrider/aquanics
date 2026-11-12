import React, { useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import {
  Download,
  FileText,
  Calendar,
  Filter,
  ShoppingCart,
  Activity,
  Fish,
  Package,
  Wrench,
  BarChart3,
} from "lucide-react";

interface Report {
  title: string;
  description: string;
  date: string;
  type: "CSV" | "XLSX" | "PDF";
  category: "Sales" | "Sensors" | "Farm" | "Inventory" | "Maintenance";
  icon: React.ReactNode;
}

const reports: Report[] = [
  {
    title: "Sales Report",
    description:
      "Sales transactions, products sold, quantities, order status, and total revenue.",
    date: "Current Month",
    type: "CSV",
    category: "Sales",
    icon: <ShoppingCart size={24} />,
  },
  {
    title: "Sensor Readings Report",
    description:
      "Water temperature, pH, water level, battery voltage, current, and distance readings.",
    date: "Last 30 Days",
    type: "XLSX",
    category: "Sensors",
    icon: <Activity size={24} />,
  },
  {
    title: "Farm Production Report",
    description:
      "Crayfish batches, stocks, mortality, harvested quantities, and production data.",
    date: "Current Month",
    type: "PDF",
    category: "Farm",
    icon: <Fish size={24} />,
  },
  {
    title: "Inventory Report",
    description:
      "Available products, quantities, prices, selling type, and stock levels.",
    date: "Current Inventory",
    type: "XLSX",
    category: "Inventory",
    icon: <Package size={24} />,
  },
  {
    title: "Maintenance Report",
    description:
      "Maintenance activities, equipment status, dates, and maintenance records.",
    date: "Last 30 Days",
    type: "PDF",
    category: "Maintenance",
    icon: <Wrench size={24} />,
  },
  {
    title: "Complete Farm Report",
    description:
      "Summary of sales, sensors, farm production, inventory, and maintenance.",
    date: "Current Period",
    type: "PDF",
    category: "Farm",
    icon: <BarChart3 size={24} />,
  },
];

export default function Reports() {
  const [filter, setFilter] = useState("All");

  const categories = [
    "All",
    "Sales",
    "Sensors",
    "Farm",
    "Inventory",
    "Maintenance",
  ];

  const filteredReports = useMemo(() => {
    if (filter === "All") return reports;

    return reports.filter((report) => report.category === filter);
  }, [filter]);

  const handleExport = (report: Report) => {
    /*
     * TEMPORARY EXPORT
     *
     * Replace this later with your Laravel API:
     *
     * /api/reports/sales
     * /api/reports/sensors
     * /api/reports/farm
     * /api/reports/inventory
     * /api/reports/maintenance
     *
     * The backend can then generate real PDF/CSV/XLSX files.
     */

    let content = "";

    if (report.title === "Sales Report") {
      content = [
        "CRAYTECH SALES REPORT",
        "======================",
        "",
        "Date,Order ID,Customer,Product,Quantity,Amount,Status",
        "2026-08-14,ORD-001,Sample Customer,Fresh Crayfish,2,500,Completed",
        "2026-08-14,ORD-002,Sample Customer,Fresh Crayfish,1,250,Pending",
        "",
        "TOTAL SALES: PHP 750",
      ].join("\n");
    } else if (report.title === "Sensor Readings Report") {
      content = [
        "CRAYTECH SENSOR READINGS REPORT",
        "===============================",
        "",
        "Timestamp,Temperature,pH,Battery Voltage,Current,Distance,Water Level",
        "2026-08-14 14:00,30.5,7.1,12.1,0.85,20.4,66%",
        "2026-08-14 14:10,30.7,7.0,12.0,0.82,20.8,65%",
        "2026-08-14 14:20,30.6,7.2,12.0,0.81,20.5,66%",
      ].join("\n");
    } else if (report.title === "Farm Production Report") {
      content = [
        "CRAYTECH FARM PRODUCTION REPORT",
        "================================",
        "",
        "Batch,Crayfish Type,Area,Stock,Harvested,Mortality,Available",
        "BATCH-001,Redclaw,Area A,500,100,10,390",
        "BATCH-002,Redclaw,Area B,400,50,5,345",
      ].join("\n");
    } else if (report.title === "Inventory Report") {
      content = [
        "CRAYTECH INVENTORY REPORT",
        "=========================",
        "",
        "Product,Quantity,Selling Type,Price,Availability",
        "Fresh Crayfish,50,Piece,250,Available",
        "Fresh Crayfish,25,Kilogram,900,Available",
      ].join("\n");
    } else if (report.title === "Maintenance Report") {
      content = [
        "CRAYTECH MAINTENANCE REPORT",
        "============================",
        "",
        "Date,Equipment,Activity,Status,Remarks",
        "2026-08-10,Water Pump,Cleaning,Completed,Normal",
        "2026-08-12,Feeder,Inspection,Completed,Working properly",
      ].join("\n");
    } else {
      content = [
        "CRAYTECH COMPLETE FARM REPORT",
        "==============================",
        "",
        "SALES",
        "Total Orders: 25",
        "Completed Orders: 20",
        "Total Revenue: PHP 15,500",
        "",
        "SENSOR READINGS",
        "Average Temperature: 30.5 C",
        "Average pH: 7.1",
        "Average Water Level: 65%",
        "",
        "FARM PRODUCTION",
        "Total Stock: 900 pcs",
        "Total Harvested: 150 pcs",
        "Total Mortality: 15 pcs",
        "",
        "INVENTORY",
        "Available Products: 2",
        "",
        "MAINTENANCE",
        "Completed Activities: 2",
      ].join("\n");
    }

    const blob = new Blob([content], {
      type: "text/csv;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `${report.title.toLowerCase().replace(/\s+/g, "-")}.csv`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  const handleExportAll = () => {
    const content = [
      "CRAYTECH FARM MANAGEMENT REPORTS",
      "=================================",
      "",
      `Generated: ${new Date().toLocaleString()}`,
      "",
      ...reports.map(
        (report) =>
          `${report.title}\nCategory: ${report.category}\nPeriod: ${report.date}\nFormat: ${report.type}\nDescription: ${report.description}\n`,
      ),
    ].join("\n");

    const blob = new Blob([content], {
      type: "text/plain;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "craytech-reports.txt";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-900">
            Reports
          </h1>

          <p className="text-slate-500 mt-1">
            Generate and export CRAYTECH farm management data.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={handleExportAll} className="flex items-center gap-2">
            <Download size={17} />
            Export All
          </Button>
        </div>
      </div>

      {/* SUMMARY */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card className="border-slate-200">
          <CardContent className="p-5">
            <p className="text-xs uppercase font-bold text-slate-400">
              Available Reports
            </p>

            <p className="text-3xl font-display font-bold text-slate-900 mt-1">
              {reports.length}
            </p>

            <p className="text-xs text-slate-500 mt-1">
              CRAYTECH report templates
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="p-5">
            <p className="text-xs uppercase font-bold text-slate-400">
              Report Categories
            </p>

            <p className="text-3xl font-display font-bold text-slate-900 mt-1">
              {categories.length - 1}
            </p>

            <p className="text-xs text-slate-500 mt-1">
              Sales, sensors, farm and operations
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="p-5">
            <p className="text-xs uppercase font-bold text-slate-400">
              Data Source
            </p>

            <p className="text-xl font-display font-bold text-slate-900 mt-2">
              CRAYTECH
            </p>

            <p className="text-xs text-slate-500 mt-1">
              Farm and IoT system data
            </p>
          </CardContent>
        </Card>
      </div>

      {/* FILTER */}
      <Card className="border-slate-200">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <Filter size={17} />
              Filter Reports
            </div>

            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setFilter(category)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    filter === category
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* REPORT LIST */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle>Available Reports</CardTitle>

          <CardDescription>
            Select a report to export CRAYTECH farm and sensor data.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredReports.map((report) => (
              <Card
                key={report.title}
                className="hover:shadow-md transition-shadow border-slate-200"
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    {/* ICON */}
                    <div className="bg-slate-100 p-3 rounded-lg text-slate-600 shrink-0">
                      {report.icon}
                    </div>

                    {/* INFORMATION */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-900">
                        {report.title}
                      </h3>

                      <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                        {report.description}
                      </p>

                      <div className="flex flex-wrap items-center gap-2 mt-3 text-xs">
                        <div className="flex items-center gap-1 text-slate-500">
                          <Calendar size={12} />
                          <span>{report.date}</span>
                        </div>

                        <span className="bg-slate-100 px-2 py-1 rounded text-slate-600 font-mono font-semibold">
                          {report.type}
                        </span>
                      </div>
                    </div>

                    {/* DOWNLOAD */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleExport(report)}
                      className="text-slate-400 hover:text-slate-600 shrink-0"
                      title={`Export ${report.title}`}
                    >
                      <Download size={18} />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredReports.length === 0 && (
            <div className="text-center py-12">
              <FileText size={40} className="mx-auto text-slate-300" />

              <p className="text-sm text-slate-500 mt-3">
                No reports found for this category.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* INFORMATION */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <FileText size={20} className="text-slate-500 mt-0.5 shrink-0" />

          <div>
            <p className="text-sm font-bold text-slate-800">
              CRAYTECH Report Information
            </p>

            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Reports can contain sales transactions, sensor readings, crayfish
              production, inventory, and maintenance records. The report
              generation can be connected to your Laravel API and Firebase
              sensor data to produce real-time reports.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
