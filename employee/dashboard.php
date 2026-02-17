<?php
require_once __DIR__ . '/../admin/config.php';
requireRole(['sales_executive', 'telecaller']);
define('PAGE_TITLE', 'My Dashboard');

$uid = getUserId();
$today = date('Y-m-d');

// Today's follow-ups
$todayFollowups = $pdo->prepare("
    SELECT f.*, l.name AS lead_name, l.phone AS lead_phone, l.status AS lead_status
    FROM followups f
    JOIN leads l ON f.lead_id = l.id
    WHERE f.employee_id = ? AND f.followup_date = ? AND f.status = 'Pending'
    ORDER BY f.followup_time ASC
");
$todayFollowups->execute([$uid, $today]);
$followups = $todayFollowups->fetchAll();

// My lead counts
$leadCounts = $pdo->prepare("
    SELECT status, COUNT(*) as cnt FROM leads WHERE assigned_to = ? GROUP BY status
");
$leadCounts->execute([$uid]);
$counts = [];
foreach ($leadCounts->fetchAll() as $row) {
    $counts[$row['status']] = $row['cnt'];
}
$totalLeads = array_sum($counts);

// Today's site visits
$todayVisits = $pdo->prepare("
    SELECT sv.*, l.name AS lead_name, l.phone AS lead_phone, p.name AS project_name
    FROM site_visits sv
    JOIN leads l ON sv.lead_id = l.id
    LEFT JOIN projects p ON sv.project_id = p.id
    WHERE sv.employee_id = ? AND sv.visit_date = ? AND sv.status = 'Scheduled'
    ORDER BY sv.visit_time ASC
");
$todayVisits->execute([$uid, $today]);
$visits = $todayVisits->fetchAll();

// My bookings this month
$monthBookings = $pdo->prepare("
    SELECT COUNT(*) as cnt, COALESCE(SUM(amount),0) as total
    FROM bookings WHERE employee_id = ? AND MONTH(booking_date) = MONTH(CURDATE()) AND YEAR(booking_date) = YEAR(CURDATE())
");
$monthBookings->execute([$uid]);
$bookingStats = $monthBookings->fetch();

// Recent leads
$recentLeads = $pdo->prepare("
    SELECT l.*, p.name AS project_name
    FROM leads l
    LEFT JOIN projects p ON l.project_interest = p.id
    WHERE l.assigned_to = ?
    ORDER BY l.updated_at DESC LIMIT 5
");
$recentLeads->execute([$uid]);
$recent = $recentLeads->fetchAll();

include __DIR__ . '/../includes/header.php';
?>

<!-- Quick Actions -->
<div class="quick-actions">
  <a href="/employee/leads/add.php" class="quick-action">
    <span class="qa-icon">&#10133;</span>
    Add Lead
  </a>
  <a href="/employee/followup/add.php" class="quick-action">
    <span class="qa-icon">&#128222;</span>
    Log Follow-up
  </a>
  <a href="/employee/site-visits/schedule.php" class="quick-action">
    <span class="qa-icon">&#127968;</span>
    Site Visit
  </a>
  <a href="/employee/bookings/create.php" class="quick-action">
    <span class="qa-icon">&#128176;</span>
    Booking
  </a>
</div>

<!-- Stats -->
<div class="stats-grid">
  <div class="stat-card purple">
    <div class="stat-icon">&#128203;</div>
    <div class="stat-value"><?= $totalLeads ?></div>
    <div class="stat-label">Total Leads</div>
  </div>
  <div class="stat-card red">
    <div class="stat-icon">&#128293;</div>
    <div class="stat-value"><?= $counts['Hot'] ?? 0 ?></div>
    <div class="stat-label">Hot Leads</div>
  </div>
  <div class="stat-card orange">
    <div class="stat-icon">&#128222;</div>
    <div class="stat-value"><?= count($followups) ?></div>
    <div class="stat-label">Today's Follow-ups</div>
  </div>
  <div class="stat-card green">
    <div class="stat-icon">&#128176;</div>
    <div class="stat-value"><?= $bookingStats['cnt'] ?? 0 ?></div>
    <div class="stat-label">Bookings (Month)</div>
  </div>
</div>

<!-- Today's Follow-ups -->
<div class="card">
  <div class="card-header">
    <h3 class="card-title">&#128222; Today's Follow-ups</h3>
    <a href="/employee/followup/today.php" class="btn btn-outline btn-sm">View All</a>
  </div>
  <?php if (empty($followups)): ?>
    <div class="empty-state">
      <div class="empty-icon">&#9989;</div>
      <p>No pending follow-ups for today</p>
    </div>
  <?php else: ?>
    <?php foreach ($followups as $f): ?>
    <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid #f0f0f0;">
      <div>
        <strong><?= sanitize($f['lead_name']) ?></strong>
        <div class="text-sm text-muted">
          <?= sanitize($f['lead_phone']) ?>
          <?php if ($f['followup_time']): ?>
            &middot; <?= date('h:i A', strtotime($f['followup_time'])) ?>
          <?php endif; ?>
        </div>
        <?php if ($f['notes']): ?>
          <div class="text-sm" style="color:#6b7280;margin-top:2px;"><?= sanitize(substr($f['notes'], 0, 60)) ?></div>
        <?php endif; ?>
      </div>
      <div style="display:flex;gap:6px;">
        <a href="tel:<?= sanitize($f['lead_phone']) ?>" class="btn btn-success btn-sm">&#128222; Call</a>
        <a href="/employee/followup/add.php?lead_id=<?= $f['lead_id'] ?>&followup_id=<?= $f['id'] ?>" class="btn btn-outline btn-sm">Done</a>
      </div>
    </div>
    <?php endforeach; ?>
  <?php endif; ?>
</div>

<!-- Today's Site Visits -->
<?php if (!empty($visits)): ?>
<div class="card">
  <div class="card-header">
    <h3 class="card-title">&#127968; Today's Site Visits</h3>
  </div>
  <?php foreach ($visits as $v): ?>
  <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid #f0f0f0;">
    <div>
      <strong><?= sanitize($v['lead_name']) ?></strong>
      <div class="text-sm text-muted">
        <?= sanitize($v['project_name'] ?? 'N/A') ?>
        &middot; <?= $v['visit_time'] ? date('h:i A', strtotime($v['visit_time'])) : 'TBD' ?>
      </div>
    </div>
    <a href="tel:<?= sanitize($v['lead_phone']) ?>" class="btn btn-success btn-sm">&#128222;</a>
  </div>
  <?php endforeach; ?>
</div>
<?php endif; ?>

<!-- Recent Leads -->
<div class="card">
  <div class="card-header">
    <h3 class="card-title">&#128203; Recent Leads</h3>
    <a href="/employee/leads/my-leads.php" class="btn btn-outline btn-sm">All Leads</a>
  </div>
  <?php if (empty($recent)): ?>
    <div class="empty-state">
      <div class="empty-icon">&#128203;</div>
      <p>No leads assigned yet</p>
    </div>
  <?php else: ?>
  <div class="table-wrap">
    <table>
      <thead>
        <tr><th>Name</th><th>Status</th><th>Project</th><th>Updated</th></tr>
      </thead>
      <tbody>
        <?php foreach ($recent as $lead): ?>
        <tr onclick="window.location='/employee/leads/view.php?id=<?= $lead['id'] ?>'" style="cursor:pointer;">
          <td>
            <strong><?= sanitize($lead['name']) ?></strong>
            <div class="text-sm text-muted"><?= sanitize($lead['phone']) ?></div>
          </td>
          <td><span class="badge badge-<?= strtolower($lead['status']) ?>"><?= $lead['status'] ?></span></td>
          <td class="text-sm"><?= sanitize($lead['project_name'] ?? '-') ?></td>
          <td class="text-sm text-muted"><?= timeAgo($lead['updated_at']) ?></td>
        </tr>
        <?php endforeach; ?>
      </tbody>
    </table>
  </div>
  <?php endif; ?>
</div>

<?php include __DIR__ . '/../includes/footer.php'; ?>
