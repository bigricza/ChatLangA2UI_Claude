# Dashboard Template Layouts

The ChatLangA2UI system supports 6 different dashboard templates to create visual variety. You can specify a template in your query or let the system choose dynamically.

## Template Overview

### Template 1 - Classic Dashboard (Default)
**Layout**: Horizontal KPIs → Charts in row → Table at bottom
**Best for**: Standard dashboards, balanced content
**Structure**:
```
├── Title
├── Row of KPI Cards (horizontal)
├── Row of Charts (side by side)
└── Data Table
```

**Example Queries**:
- "Show me a sales dashboard using template 1"
- "Create a customer analytics dashboard"
- "Build an IT asset tracking dashboard template 1"

---

### Template 2 - Sidebar Layout
**Layout**: KPIs in left sidebar, charts on right, table below
**Best for**: Many KPIs with multiple charts, executive dashboards
**Structure**:
```
├── Title
├── Row
│   ├── Column (Left): KPI Cards stacked
│   └── Column (Right): Charts stacked
└── Data Table (full width)
```

**Example Queries**:
- "Show me a revenue dashboard with sidebar layout"
- "Create a system monitoring dashboard template 2"
- "Build a license management dashboard with template 2"

---

### Template 3 - Grid Layout
**Layout**: 2x2 or 3x3 grid of cards
**Best for**: Multiple equal-priority metrics or charts
**Structure**:
```
├── Title
├── Row
│   ├── Card (Chart/Metric)
│   └── Card (Chart/Metric)
├── Row
│   ├── Card (Chart/Metric)
│   └── Card (Chart/Metric)
```

**Example Queries**:
- "Show me a KPI dashboard in grid layout"
- "Create a service health dashboard template 3"
- "Build a quarterly metrics grid template 3"

---

### Template 4 - Feature Focus
**Layout**: Large hero chart, small KPIs below, secondary content
**Best for**: Highlighting one main chart or metric
**Structure**:
```
├── Title
├── Card with Large Featured Chart (full width)
├── Row of Small KPI Cards
└── Row with Secondary Charts or Table
```

**Example Queries**:
- "Show me a trending chart dashboard with layout 4"
- "Create a revenue growth focused dashboard"
- "Build a performance dashboard template 4"

---

### Template 5 - Card Stack
**Layout**: Each section in its own card, vertically stacked
**Best for**: Clear separation of concerns, mobile-friendly
**Structure**:
```
├── Title
├── Card 1: KPIs in Row
├── Card 2: Primary Chart
├── Card 3: Secondary Chart
└── Card 4: Data Table
```

**Example Queries**:
- "Show me a stacked card dashboard"
- "Create a software metrics dashboard template 5"
- "Build a project status dashboard with layout 5"

---

### Template 6 - Split View
**Layout**: Two equal columns side by side
**Best for**: Comparing two datasets or views
**Structure**:
```
├── Title
└── Row
    ├── Column (Left): KPIs + Chart
    └── Column (Right): Table or Chart
```

**Example Queries**:
- "Show me a split view comparison dashboard"
- "Create a before/after metrics dashboard template 6"
- "Build a department comparison dashboard layout 6"

---

## How to Use Templates

### Explicit Template Selection
Add template number to your query:
```
"Show me a sales dashboard using template 3"
"Create an IT asset tracker with layout 5"
"Build a KPI dashboard style 2"
```

### Dynamic Selection
Just describe what you want - the system will choose an appropriate template:
```
"Show me a customer analytics dashboard"
"Create a cloud infrastructure overview"
"Build a license compliance dashboard"
```

The system will vary templates automatically to create visual interest.

---

## Example Queries by Use Case

### IT & Infrastructure
```
"Build an IT asset tracking dashboard template 1"
"Create a server monitoring dashboard with sidebar layout"
"Show me a network performance grid template 3"
"Build a cloud cost dashboard template 4"
```

### Business Analytics
```
"Show me a sales performance dashboard template 1"
"Create a customer analytics split view template 6"
"Build a quarterly revenue dashboard layout 4"
"Show me a marketing metrics card stack template 5"
```

### License & Compliance
```
"Create a software license dashboard template 2"
"Build a license compliance tracker layout 1"
"Show me a vendor cost breakdown template 3"
"Create an expiring licenses dashboard template 6"
```

### Operations & Services
```
"Build a service desk dashboard template 1"
"Show me an incident management grid template 3"
"Create a SLA compliance dashboard layout 5"
"Build a ticket volume dashboard template 4"
```

---

## Tips for Best Results

1. **Be specific about data**: Mention what metrics, charts, and tables you want
2. **Specify template when desired**: Add "template X" or "layout X" to your query
3. **Let it vary**: For variety, omit template number and let the system choose
4. **Try different templates**: Same dashboard with different templates can reveal different insights
5. **Combine with examples**: Reference the example queries from the main documentation

---

## Template Characteristics

| Template | Layout Style | KPI Display | Best For | Complexity |
|----------|-------------|-------------|----------|------------|
| 1 - Classic | Horizontal | Row at top | General purpose | Simple |
| 2 - Sidebar | Left column | Vertical stack | Many metrics | Medium |
| 3 - Grid | Equal cells | In grid cells | Multiple views | Medium |
| 4 - Feature | Hero element | Below main | Focus on one | Simple |
| 5 - Card Stack | Vertical | In card | Mobile, clarity | Medium |
| 6 - Split | Two columns | Left column | Comparisons | Simple |

---

## Switching Templates

You can regenerate the same dashboard with a different template:
```
First: "Show me a sales dashboard"
Then: "Show the same data using template 3"
Or: "Regenerate with grid layout"
```

The system will understand and apply the new template while keeping similar content.
