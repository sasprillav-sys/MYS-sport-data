const demoData = [
  {
    id: "sub10",
    name: "Sub-10",
    coaches: [
      { id: "natalia", name: "Natalia Ríos", athletes: 13, attendance: [78, 82, 80, 85, 88, 86], load: [5.2, 5.8, 6.1, 5.7, 6.3, 6.0], performance: [58, 60, 63, 64, 67, 69], psychomotor: [61, 64, 66, 68, 71, 72] },
      { id: "diego", name: "Diego Ortiz", athletes: 11, attendance: [84, 86, 82, 88, 87, 90], load: [5.7, 6.0, 5.8, 6.3, 6.5, 6.2], performance: [62, 65, 64, 69, 70, 72], psychomotor: [65, 67, 66, 70, 72, 75] }
    ]
  },
  {
    id: "sub13",
    name: "Sub-13",
    coaches: [
      { id: "andres", name: "Andrés Mina", athletes: 16, attendance: [87, 85, 89, 84, 90, 88], load: [6.4, 6.7, 7.0, 6.5, 6.9, 6.8], performance: [68, 69, 71, 70, 74, 76], psychomotor: [70, 71, 73, 72, 75, 77] },
      { id: "laura", name: "Laura Perea", athletes: 14, attendance: [82, 84, 86, 87, 85, 89], load: [6.0, 6.2, 6.6, 6.8, 6.4, 6.7], performance: [66, 68, 70, 72, 73, 75], psychomotor: [68, 70, 72, 73, 76, 78] }
    ]
  },
  {
    id: "sub16",
    name: "Sub-16",
    coaches: [
      { id: "juliana", name: "Juliana Paz", athletes: 15, attendance: [88, 91, 87, 89, 92, 90], load: [7.0, 7.3, 7.5, 7.1, 7.6, 7.4], performance: [73, 75, 74, 78, 80, 82], psychomotor: [76, 78, 77, 80, 82, 84] },
      { id: "camilo", name: "Camilo Solís", athletes: 13, attendance: [85, 87, 89, 86, 90, 91], load: [6.8, 7.0, 7.2, 7.4, 7.1, 7.5], performance: [71, 73, 76, 77, 79, 81], psychomotor: [74, 76, 79, 80, 82, 83] }
    ]
  }
];

const metricConfig = {
  attendance: { label: "Asistencia", trend: "Asistencia por semana", legend: "Participación promedio", unit: "%", max: 100 },
  load: { label: "Carga de entrenamiento", trend: "Carga de sesión por semana", legend: "Esfuerzo percibido promedio", unit: "/10", max: 10 },
  performance: { label: "Rendimiento deportivo", trend: "Rendimiento por semana", legend: "Índice de observación", unit: "/100", max: 100 },
  psychomotor: { label: "Seguimiento psicomotor", trend: "Seguimiento psicomotor por semana", legend: "Índice de seguimiento", unit: "/100", max: 100 }
};

const categoryFilter = document.querySelector("#category-filter");
const coachFilter = document.querySelector("#coach-filter");
const metricFilter = document.querySelector("#metric-filter");
const trendChart = document.querySelector("#trend-chart");
const categoryChart = document.querySelector("#category-chart");

function getVisibleGroups() {
  const selectedCategory = categoryFilter.value;
  const selectedCoach = coachFilter.value;

  return demoData
    .filter((category) => selectedCategory === "all" || category.id === selectedCategory)
    .flatMap((category) => category.coaches
      .filter((coach) => selectedCoach === "all" || coach.id === selectedCoach)
      .map((coach) => ({ ...coach, categoryId: category.id, categoryName: category.name })));
}

function weightedAverage(groups, key) {
  const totalAthletes = groups.reduce((sum, group) => sum + group.athletes, 0);
  if (!totalAthletes) return 0;
  return groups.reduce((sum, group) => sum + group[key].reduce((a, b) => a + b, 0) / group[key].length * group.athletes, 0) / totalAthletes;
}

function weightedTrend(groups, key) {
  const totalAthletes = groups.reduce((sum, group) => sum + group.athletes, 0);
  if (!totalAthletes) return [];
  return groups[0][key].map((_, index) =>
    groups.reduce((sum, group) => sum + group[key][index] * group.athletes, 0) / totalAthletes
  );
}

function displayNumber(value, decimals = 0) {
  return Number(value).toFixed(decimals).replace(".", ",");
}

function setKpiValue(elementId, value, suffix, decimals = 0) {
  const element = document.getElementById(elementId);
  element.replaceChildren(document.createTextNode(displayNumber(value, decimals)));
  if (suffix) {
    const unit = document.createElement("span");
    unit.textContent = suffix;
    element.append(unit);
  }
}

function updateCoachOptions() {
  const currentCoach = coachFilter.value;
  const selectedCategory = categoryFilter.value;
  const availableCoaches = demoData
    .filter((category) => selectedCategory === "all" || category.id === selectedCategory)
    .flatMap((category) => category.coaches);

  coachFilter.replaceChildren(new Option("Todos los entrenadores", "all"));
  availableCoaches.forEach((coach) => coachFilter.add(new Option(coach.name, coach.id)));

  if (availableCoaches.some((coach) => coach.id === currentCoach)) {
    coachFilter.value = currentCoach;
  } else {
    coachFilter.value = "all";
  }
}

function renderTrendChart(values, metricKey) {
  const config = metricConfig[metricKey];
  const width = 640;
  const height = 230;
  const left = 42;
  const right = 12;
  const top = 14;
  const bottom = 16;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;
  const x = (index) => left + index * plotWidth / (values.length - 1);
  const y = (value) => top + (1 - value / config.max) * plotHeight;
  const points = values.map((value, index) => `${x(index)},${y(value)}`);
  const areaPath = `M ${left},${top + plotHeight} L ${points.join(" L ")} L ${left + plotWidth},${top + plotHeight} Z`;
  const linePath = `M ${points.join(" L ")}`;

  const grid = [0, 1, 2, 3, 4].map((step) => {
    const value = config.max * (1 - step / 4);
    const lineY = top + plotHeight * step / 4;
    const label = metricKey === "load" ? displayNumber(value, value % 1 ? 1 : 0) : Math.round(value);
    return `<line class="chart-gridline" x1="${left}" y1="${lineY}" x2="${width - right}" y2="${lineY}"></line><text class="chart-y-label" x="0" y="${lineY + 3}">${label}</text>`;
  }).join("");

  const circles = values.map((value, index) =>
    `<circle class="chart-point" cx="${x(index)}" cy="${y(value)}" r="4"><title>Semana ${index + 1}: ${displayNumber(value, metricKey === "load" ? 1 : 0)} ${config.unit}</title></circle>`
  ).join("");

  trendChart.innerHTML = `<defs><linearGradient id="chartFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stop-color="#9ac852" stop-opacity=".24"></stop><stop offset="100%" stop-color="#9ac852" stop-opacity=".01"></stop></linearGradient></defs>${grid}<path class="chart-area" d="${areaPath}"></path><path class="chart-line" d="${linePath}"></path>${circles}`;
  trendChart.setAttribute("aria-label", `${config.trend}, datos de demostración.`);
  document.querySelector("#trend-title").textContent = config.trend;
  document.querySelector("#trend-unit").textContent = config.unit;
  document.querySelector("#trend-legend").textContent = config.legend;
}

function getCategoryGroups(category) {
  return category.coaches.filter((coach) => coachFilter.value === "all" || coach.id === coachFilter.value);
}

function renderCategoryChart(metricKey) {
  const config = metricConfig[metricKey];
  const selectedCategory = categoryFilter.value;
  const selectedCoach = coachFilter.value;
  let rows;
  let comparisonLabel;

  if (selectedCategory !== "all") {
    const category = demoData.find((item) => item.id === selectedCategory);
    rows = category.coaches
      .filter((coach) => selectedCoach === "all" || coach.id === selectedCoach)
      .map((coach) => ({ name: coach.name, value: weightedAverage([coach], metricKey) }));
    comparisonLabel = "entrenador";
    categoryChart.classList.add("compare-coach");
  } else {
    rows = demoData.map((category) => {
      const groups = getCategoryGroups(category);
      if (!groups.length) return null;
      return { name: category.name, value: weightedAverage(groups, metricKey) };
    }).filter(Boolean);
    comparisonLabel = "categoría";
    categoryChart.classList.remove("compare-coach");
  }

  document.querySelector("#category-chart-title").textContent = `Por ${comparisonLabel}`;
  categoryChart.setAttribute("aria-label", `Comparativo de ${config.label.toLowerCase()} por ${comparisonLabel}, datos de demostración.`);
  categoryChart.innerHTML = rows.map((row) => {
    const width = Math.max(0, Math.min(100, row.value / config.max * 100));
    const displayValue = `${displayNumber(row.value, metricKey === "load" ? 1 : 0)}${metricKey === "attendance" ? "%" : ""}`;
    return `<div class="bar-row"><span class="bar-label">${row.name}</span><div class="bar-track"><div class="bar-fill" style="width:${width}%"></div></div><span class="bar-value">${displayValue}</span></div>`;
  }).join("");
}

function renderAlerts(groups) {
  const attendance = weightedAverage(groups, "attendance");
  const load = weightedAverage(groups, "load");
  const alerts = [
    attendance < 84
      ? ["alert-amber", "Revisar continuidad", "Contrastar la asistencia con horarios y conversar con el grupo.", "PARTICIPACIÓN"]
      : ["alert-green", "Observar participación", "Revisar la tendencia semanal junto con el contexto del grupo.", "PARTICIPACIÓN"],
    load >= 7.2
      ? ["alert-amber", "Conversar sobre la carga", "Contrastar el esfuerzo percibido con la planificación de la semana.", "CARGA"]
      : ["alert-blue", "Planificar recuperación", "Considerar carga percibida y recuperación dentro de la planificación.", "CARGA"],
    ["alert-green", "Registrar avances", "Documentar observaciones de coordinación y habilidades motrices.", "DESARROLLO"]
  ];

  document.querySelector("#alert-list").innerHTML = alerts.map(([color, title, description, tag]) =>
    `<div class="alert-item"><span class="alert-dot ${color}"></span><p><strong>${title}</strong><small>${description}</small></p><span class="alert-tag">${tag}</span></div>`
  ).join("");
}

function renderDashboard() {
  const groups = getVisibleGroups();
  const athleteCount = groups.reduce((total, group) => total + group.athletes, 0);
  const coachNames = [...new Set(groups.map((group) => group.name))];

  setKpiValue("kpi-attendance", weightedAverage(groups, "attendance"), "%");
  setKpiValue("kpi-load", weightedAverage(groups, "load"), "/10", 1);
  setKpiValue("kpi-psychomotor", weightedAverage(groups, "psychomotor"), "/100");
  setKpiValue("kpi-performance", weightedAverage(groups, "performance"), "/100");
  setKpiValue("kpi-athletes", athleteCount, "");
  document.querySelector("#kpi-attendance-note").textContent = coachNames.length === 1
    ? `Participación · ${coachNames[0]}`
    : "Participación semanal estimada";
  document.querySelector("#kpi-athletes-note").textContent = `${groups.length} grupos de entrenamiento · ejemplo`;
  renderTrendChart(weightedTrend(groups, metricFilter.value), metricFilter.value);
  renderCategoryChart(metricFilter.value);
  renderAlerts(groups);
}

categoryFilter.addEventListener("change", () => {
  updateCoachOptions();
  renderDashboard();
});
coachFilter.addEventListener("change", renderDashboard);
metricFilter.addEventListener("change", renderDashboard);

const menuToggle = document.querySelector(".menu-toggle");
const siteNav = document.querySelector("#site-nav");

function closeMenu() {
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.setAttribute("aria-label", "Abrir menú");
  siteNav.classList.remove("is-open");
}

menuToggle.addEventListener("click", () => {
  const isOpen = menuToggle.getAttribute("aria-expanded") !== "true";
  menuToggle.setAttribute("aria-expanded", String(isOpen));
  menuToggle.setAttribute("aria-label", isOpen ? "Cerrar menú" : "Abrir menú");
  siteNav.classList.toggle("is-open", isOpen);
});
siteNav.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMenu));
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeMenu();
});

updateCoachOptions();
renderDashboard();
