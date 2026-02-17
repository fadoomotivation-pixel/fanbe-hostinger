<?php
require_once __DIR__ . '/../config.php';
requireRole(['super_admin', 'manager', 'sub_admin']);
define('PAGE_TITLE', 'Lead Analytics');

// Overall stats
$totalLeads = $pdo->query("SELECT COUNT(*) FROM leads")->fetchColumn();
$thisMonthLeads = $pdo->query("SELECT COUNT(*) FROM leads WHERE MONTH(created_at) = MONTH(CURDATE()) AND YEAR(created_at) = YEAR(CURDATE())")->fetchColumn();

// By status
$byStatus = $pdo->query("SELECT status, COUNT(*) as cnt FROM leads GROUP BY status ORDER BY cnt DESC")->fetchAll();

// By source
$bySource = $pdo->query("SELECT source, COUNT(*) as cnt FROM leads GROUP BY source ORDER BY cnt DESC")->fetchAll();

// By project
$byProject = $pdo->query("
    SELECT p.name, COUNT(l.id) as cnt,
           COUNT(CASE WHEN l.status = 'Converted' THEN 1 END) as converted
    FROM leads l
    LEFT JOIN projects p ON l.project_interest = p.id
    GROUP BY l.project_interest
    ORDER BY cnt DESC
")->fetchAll();

// Conversion rate
$converted = $pdo->query("SELECT COUNT(*) FROM leads WHERE status = 'Converted'")->fetchColumn();
$conversionRate = $totalLeads > 0 ? round(($converted / $totalLeads) * 100, 1) : 0;

// Unassigned leads
$unassigned = $pdo->query("SELECT COUNT(*) FROM leads WHERE assigned_to IS NULL")->fetchColumn();

include __DIR__ . '/../../includes/header.php';
?>

<div class="page-header">
  <h1>&#128202; Lead Analytics</h1>
</div>

<!-- Summary -->
<div class="stats-grid">
  <div class="stat-card purple">
    <div class="stat-value"><?= $totalLeads ?></div>
    <div class="stat-label">Total Leads</div>
  </div>
  <div class="stat-card blue">
    <div class="stat-value"><?= $thisMonthLeads ?></div>
    <div class="stat-label">This Month</div>
  </div>
  <div class="stat-card green">
    <div class="stat-value"><?= $conversionRate ?>%</div>
    <div class="stat-label">Conversion</div>
  </div>
  <div class="stat-card red">
    <div class="stat-value"><?= $unassigned ?></div>
    <div class="stat-label">Unassigned</div>
  </div>
</div>

<!-- By Status -->
<div class="card">
  <h3 class="card-title" style="margin-bottom:12px;">By Status</h3>
  <?php foreach ($byStatus as $s): ?>
  <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid #f0f0f0;">
    <span class="badge badge-<?= strtolower($s['status']) ?>" style="min-width:80px;text-align:center;"><?= $s['status'] ?></span>
    <div style="flex:1;background:#f0f0f0;border-radius:4px;height:20px;overflow:hidden;">
      <div style="height:100%;background:linear-gradient(135deg,#667eea,#764ba2);border-radius:4px;width:<?= $totalLeads > 0 ? round(($s['cnt']/$totalLeads)*100) : 0 ?>%;"></div>
    </div>
    <strong style="min-width:40px;text-align:right;"><?= $s['cnt'] ?></strong>
  </div>
  <?php endforeach; ?>
</div>

<!-- By Source -->
<div class="card">
  <h3 class="card-title" style="margin-bottom:12px;">By Source</h3>
  <?php foreach ($bySource as $s): ?>
  <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid #f0f0f0;">
    <span style="min-width:100px;font-size:0.85rem;font-weight:600;"><?= sanitize($s['source']) ?></span>
    <div style="flex:1;background:#f0f0f0;border-radius:4px;height:20px;overflow:hidden;">
      <div style="height:100%;background:linear-gradient(135deg,#10b981,#059669);border-radius:4px;width:<?= $totalLeads > 0 ? round(($s['cnt']/$totalLeads)*100) : 0 ?>%;"></div>
    </div>
    <strong style="min-width:40px;text-align:right;"><?= $s['cnt'] ?></strong>
  </div>
  <?php endforeach; ?>
</div>

<!-- By Project -->
<div class="card">
  <h3 class="card-title" style="margin-bottom:12px;">By Project</h3>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Project</th><th>Leads</th><th>Converted</th><th>Rate</th></tr></thead>
      <tbody>
        <?php foreach ($byProject as $p): ?>
        <tr>
          <td><strong><?= sanitize($p['name'] ?? 'Unspecified') ?></strong></td>
          <td><?= $p['cnt'] ?></td>
          <td><?= $p['converted'] ?></td>
          <td><?= $p['cnt'] > 0 ? round(($p['converted'] / $p['cnt']) * 100) : 0 ?>%</td>
        </tr>
        <?php endforeach; ?>
      </tbody>
    </table>
  </div>
</div>

<?php include __DIR__ . '/../../includes/footer.php'; ?>
