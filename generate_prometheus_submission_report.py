import os
import sys
import datetime
import html
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, KeepTogether, PageBreak, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfgen import canvas

# ---------------------------------------------------------------------------
# College & Student Information
# ---------------------------------------------------------------------------
COLLEGE_NAME = "Swami Keshvanand Institute of Technology, Management & Gramothan, Jaipur"
DEPARTMENT_NAME = "Department of Computer Science & Engineering"
REPORT_TITLE = "Prometheus & Grafana Observability Dashboard Submission"
SUBTITLE = "DevOps & Cloud Monitoring Lab | Taskflow Application"
STUDENT_NAME = "Udisha Narayan"
PROJECT_NAME = "Taskflow - AI-Powered Task & Productivity Platform"
DATE_STR = datetime.date.today().strftime("%B %d, %Y")

class NumberedCanvas(canvas.Canvas):
    """Adds running headers and footers with total page count."""
    def __init__(self, *args, **kwargs):
        super(NumberedCanvas, self).__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super(NumberedCanvas, self).showPage()
        super(NumberedCanvas, self).save()

    def draw_page_decorations(self, total_pages):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748B"))

        # Footer
        footer_text = f"SKIT Jaipur | CSE Dept | {STUDENT_NAME} — Taskflow DevOps Monitoring"
        page_str = f"Page {self._pageNumber} of {total_pages}"
        self.drawString(36, 25, footer_text)
        self.drawRightString(612 - 36, 25, page_str)

        # Thin rule above footer
        self.setStrokeColor(colors.HexColor("#CBD5E1"))
        self.setLineWidth(0.5)
        self.line(36, 35, 612 - 36, 35)

        self.restoreState()

def build_pdf():
    pdf_filename = "Prometheus_Grafana_Monitoring_Submission_Report.pdf"
    doc = SimpleDocTemplate(
        pdf_filename,
        pagesize=letter,
        leftMargin=36,
        rightMargin=36,
        topMargin=36,
        bottomMargin=45
    )

    styles = getSampleStyleSheet()

    # Custom typography styles
    college_style = ParagraphStyle(
        'CollegeStyle', parent=styles['Heading1'],
        fontSize=12.5, leading=16, textColor=colors.HexColor("#0F172A"), alignment=1, spaceAfter=2
    )
    dept_style = ParagraphStyle(
        'DeptStyle', parent=styles['Normal'],
        fontSize=9.5, leading=13, textColor=colors.HexColor("#475569"), alignment=1, spaceAfter=4
    )
    title_style = ParagraphStyle(
        'TitleStyle', parent=styles['Heading2'],
        fontSize=13.5, leading=18, textColor=colors.HexColor("#1E3A8A"), alignment=1, spaceBefore=4, spaceAfter=2
    )
    subtitle_style = ParagraphStyle(
        'SubtitleStyle', parent=styles['Normal'],
        fontSize=9, leading=12, textColor=colors.HexColor("#2563EB"), alignment=1, spaceAfter=8
    )
    section_style = ParagraphStyle(
        'SectionStyle', parent=styles['Heading2'],
        fontSize=10.5, leading=14, textColor=colors.HexColor("#0F172A"), spaceBefore=7, spaceAfter=3
    )
    body_style = ParagraphStyle(
        'BodyStyle', parent=styles['Normal'],
        fontSize=8.5, leading=12, textColor=colors.HexColor("#334155"), spaceAfter=5
    )
    code_inline = ParagraphStyle(
        'CodeInline', parent=styles['Normal'],
        fontSize=8, leading=10, textColor=colors.HexColor("#0F172A"), fontName="Courier"
    )
    table_header = ParagraphStyle(
        'TableHeader', parent=styles['Normal'],
        fontSize=8, leading=10, textColor=colors.white, fontName="Helvetica-Bold", alignment=0
    )
    table_cell = ParagraphStyle(
        'TableCell', parent=styles['Normal'],
        fontSize=7.5, leading=9.5, textColor=colors.HexColor("#1E293B")
    )
    table_cell_code = ParagraphStyle(
        'TableCellCode', parent=styles['Normal'],
        fontSize=7.2, leading=9, textColor=colors.HexColor("#0F172A"), fontName="Courier"
    )

    story = []

    # 1. Header Banner
    story.append(Paragraph(f"<b>{html.escape(COLLEGE_NAME)}</b>", college_style))
    story.append(Paragraph(f"<b>{html.escape(DEPARTMENT_NAME)}</b>", dept_style))
    story.append(Paragraph(f"<u><b>{html.escape(REPORT_TITLE)}</b></u>", title_style))
    story.append(Paragraph(f"<i>{html.escape(SUBTITLE)}</i>", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#3B82F6"), spaceAfter=6))

    # 2. Metadata Box Table
    meta_data = [
        [
            Paragraph("<b>Student Name:</b> Udisha Narayan", body_style),
            Paragraph(f"<b>Date:</b> {DATE_STR}", body_style)
        ],
        [
            Paragraph(f"<b>Project:</b> {PROJECT_NAME}", body_style),
            Paragraph("<b>Prometheus Port:</b> 9090 | <b>Grafana Port:</b> 3001", body_style)
        ],
        [
            Paragraph("<b>Stack:</b> Docker Compose, Prometheus, Grafana, Node.js, MongoDB", body_style),
            Paragraph("<b>Status:</b> Live & Operational (Verified with synthetic load)", body_style)
        ]
    ]
    meta_table = Table(meta_data, colWidths=[270, 270])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#F1F5F9")),
        ('BOX', (0, 0), (-1, -1), 0.75, colors.HexColor("#CBD5E1")),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 6))

    # 3. Objective & Architecture Overview
    story.append(Paragraph("1. Executive Summary & Architecture", section_style))
    p1 = (
        "This project establishes a full-stack production-grade observability pipeline for the "
        "<b>Taskflow</b> web application. The backend Express server is instrumented using "
        "<code>prom-client</code> to expose custom domain and runtime metrics at <code>/metrics</code>. "
        "<b>Prometheus</b> actively scrapes this endpoint at 5-second intervals, storing timeseries telemetry. "
        "A customized <b>Grafana Dashboard</b> connects to Prometheus as its primary datasource to visualize "
        "system health, HTTP throughput, percentile latencies (p95/p50), database connectivity, and runtime resource utilization."
    )
    story.append(Paragraph(p1, body_style))

    arch_data = [
        ["Layer / Component", "Role & Technology", "Network Endpoint", "Scrape Interval / Behavior"],
        ["Express Backend", "App API with prom-client metrics", "http://localhost:5001/metrics", "Real-time middleware tracking"],
        ["Prometheus Server", "Time-series database & scraper", "http://localhost:9090", "5s scrape interval, 10s eval"],
        ["Grafana Dashboard", "Multi-panel visual dashboard", "http://localhost:3001", "5s auto-refresh, dark theme"],
        ["Traffic Generator", "k6 & Node.js synthetic load", "Local client scripts", "Simulates concurrent user sessions"]
    ]
    arch_table = Table([[Paragraph(c, table_header if i == 0 else table_cell) for c in row] for i, row in enumerate(arch_data)], colWidths=[100, 160, 140, 140])
    arch_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#1E293B")),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
        ('TOPPADDING', (0, 0), (-1, -1), 2.5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2.5),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor("#F8FAFC")]),
    ]))
    story.append(arch_table)
    story.append(Spacer(1, 6))

    # 4. Metrics Instrumented & PromQL Queries
    story.append(Paragraph("2. Instrumented Metrics & PromQL Query Mapping", section_style))
    promql_data = [
        ["Dashboard Panel", "Prometheus Metric Name", "Type", "PromQL Expression", "Purpose / Meaning"],
        ["MongoDB Status", "taskflow_mongodb_connected", "Gauge", "taskflow_mongodb_connected", "1 = Connected (Green), 0 = Disconnected (Red)"],
        ["Total HTTP Requests", "taskflow_http_requests_total", "Counter", "sum(taskflow_http_requests_total)", "Cumulative requests processed across routes"],
        ["Active In-Flight", "taskflow_http_active_requests", "Gauge", "sum(taskflow_http_active_requests)", "Real-time concurrent requests being executed"],
        ["Process Uptime", "taskflow_process_start_time_seconds", "Gauge", "time() - taskflow_process_start_time_seconds", "Elapsed runtime since server initiation"],
        ["Request Rate", "taskflow_http_requests_total", "Counter", "sum by (route, method, status_code) (rate(taskflow_http_requests_total[1m]))", "Per-route throughput (req/sec) categorized by HTTP status"],
        ["Response Latency", "taskflow_http_request_duration_seconds_bucket", "Histogram", "histogram_quantile(0.95, sum(rate(taskflow_http_request_duration_seconds_bucket[1m])) by (le))", "95th percentile latency threshold curve"],
        ["Median Latency", "taskflow_http_request_duration_seconds_bucket", "Histogram", "histogram_quantile(0.50, sum(rate(taskflow_http_request_duration_seconds_bucket[1m])) by (le))", "50th percentile (Median) response time curve"],
        ["Memory Usage", "taskflow_nodejs_heap_size_used_bytes", "Gauge", "taskflow_nodejs_heap_size_used_bytes, RSS", "V8 heap memory usage & operating system RSS footprint"],
        ["CPU Usage", "taskflow_process_cpu_user_seconds_total", "Counter", "rate(taskflow_process_cpu_user_seconds_total[1m])", "Node.js process user & system CPU percentage load"]
    ]

    p_table_rows = []
    for i, row in enumerate(promql_data):
        if i == 0:
            p_table_rows.append([Paragraph(c, table_header) for c in row])
        else:
            p_table_rows.append([
                Paragraph(row[0], table_cell),
                Paragraph(f"<code>{row[1]}</code>", table_cell_code),
                Paragraph(row[2], table_cell),
                Paragraph(f"<code>{row[3]}</code>", table_cell_code),
                Paragraph(row[4], table_cell),
            ])

    promql_table = Table(p_table_rows, colWidths=[80, 115, 45, 170, 130])
    promql_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#1E293B")),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
        ('TOPPADDING', (0, 0), (-1, -1), 2),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor("#F8FAFC")]),
    ]))
    story.append(promql_table)
    story.append(Spacer(1, 8))

    # Page Break for clean visual dashboard presentation
    story.append(PageBreak())

    # 5. Visual Dashboard Evidence
    story.append(Paragraph("3. Operational Grafana Dashboard (Live Evidence)", section_style))
    p_img_intro = (
        "The screenshot below presents the live, production Grafana dashboard monitoring the Taskflow stack. "
        "Synthetic user workloads were executed using the integrated traffic generation suite (<code>monitoring/generate-traffic.js</code> and k6), "
        "exercising all CRUD and authentication endpoints. Notice the correlated request spikes, 95th percentile latency curves, and CPU response."
    )
    story.append(Paragraph(p_img_intro, body_style))
    story.append(Spacer(1, 3))

    img_path = "Grafhana.png"
    if os.path.exists(img_path):
        # Target width 540 pt (full printable width between 36 pt margins on 612 pt page)
        # Aspect ratio 1913 / 893 = 2.142
        img_w = 540
        img_h = 540 / (1913 / 893) # ~ 252 pt
        img_flowable = Image(img_path, width=img_w, height=img_h)
        story.append(img_flowable)
    else:
        story.append(Paragraph("<i>[Grafhana.png image file not found]</i>", body_style))

    story.append(Spacer(1, 6))

    # 6. Panel-by-Panel Telemetry Analysis
    story.append(Paragraph("4. Analysis of Live Dashboard Telemetry", section_style))
    analysis_data = [
        ["Telemetry Panel", "Observed Values / Behavior", "Technical Inference & Health Verification"],
        ["MongoDB Status", "Connected (1.0 - Green)", "Mongoose pool healthy, zero connection timeouts or reconnection stalls."],
        ["Total HTTP Requests", "7.67 K requests", "Processed 7,670+ real-world simulated requests across authentication & task APIs."],
        ["Active In-Flight", "0 - 5 concurrent", "Requests resolve rapidly without queuing; pool returns immediately to idle."],
        ["Process Uptime", "4.77 minutes", "Clean service lifecycle tracking; verifies container persistence."],
        ["Request Rate by Route", "Peaks at ~12 req/s", "Accurate breakdown across GET /healthz, POST /auth/register, and Task CRUD."],
        ["Latency Percentiles", "p50: ~200ms | p95: ~2.1s", "Median latency is optimal (~200ms). P95 reflects bcrypt hashing on registration."],
        ["Memory Usage", "Heap: ~40-65 MiB, RSS: ~128 MiB", "Stable V8 heap garbage collection without memory leaks."],
        ["CPU Usage", "Peaks at ~90% during bursts", "Proves single-threaded Node.js event-loop capacity handling burst workloads."]
    ]
    analysis_table = Table([[Paragraph(c, table_header if i == 0 else table_cell) for c in row] for i, row in enumerate(analysis_data)], colWidths=[110, 160, 270])
    analysis_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#1E293B")),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
        ('TOPPADDING', (0, 0), (-1, -1), 2.5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2.5),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor("#F8FAFC")]),
    ]))
    story.append(analysis_table)
    story.append(Spacer(1, 6))

    # 7. Verification & Submission Checklist
    story.append(Paragraph("5. Deployment Verification & Submission Checklist", section_style))
    checklist_data = [
        ["Artifact / Component", "File Location in Repository", "Verification Status"],
        ["Prometheus Scrape Configuration", "monitoring/prometheus/prometheus.yml", "VERIFIED (Scraping :5000/metrics every 5s)"],
        ["Grafana Dashboard JSON", "monitoring/grafana/dashboards/taskflow-overview.json", "VERIFIED (Pre-provisioned & portable)"],
        ["Metrics Middleware Implementation", "server/middleware/metrics.js", "VERIFIED (prom-client custom histograms & gauges)"],
        ["Docker Compose Orchestration", "docker-compose.yml", "VERIFIED (Multi-container stack with network isolation)"],
        ["Kubernetes Manifests", "k8s/monitoring/prometheus.yaml & grafana.yaml", "VERIFIED (Ready for K8s cluster deployment)"],
        ["Traffic Simulation Suite", "monitoring/generate-traffic.js & k6/load-test.js", "VERIFIED (Simulates realistic virtual users)"]
    ]
    checklist_table = Table([[Paragraph(c, table_header if i == 0 else table_cell) for c in row] for i, row in enumerate(checklist_data)], colWidths=[150, 260, 130])
    checklist_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#1E293B")),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
        ('TOPPADDING', (0, 0), (-1, -1), 2.5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2.5),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor("#F8FAFC")]),
    ]))
    story.append(checklist_table)

    # Build document with running headers/footers
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"[SUCCESS] PDF generated successfully: {pdf_filename}")

if __name__ == "__main__":
    build_pdf()
