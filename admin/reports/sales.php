<?php
require_once __DIR__ . '/../config.php';
requireRole(['super_admin', 'manager', 'sub_admin']);
define('PAGE_TITLE', 'Sales Report');

$month = $_GET['month'] ?? date('Y-m');
$monthStart = $month . '-01';
$monthEnd = date('Y-m-t', strtotime($monthStart));

// Bookings for the month
$bookings = $pdo->prepare("
    SELECT b.*, l.name AS lead_name, l.phone AS lead_phone,
           p.name AS project_name, u.full_name AS emp_name
    FROM bookings b
    JOIN leads l ON b.lead_id = l.id
    LEFT JOIN projects p ON b.project_id = p.id
    LEFT JOIN users u ON b.employee_id = u.id
    WHERE b.booking_date BETWEEN ? AND ?
    ORDER BY b.booking_date DESC
");
$bookings->execute([$monthStart, $monthEnd]);
$monthBookings = $bookings->fetchAll();

$totalAmount = array_sum(array_column($monthBookings, 'amount'));
$tokenCount = count(array_filter($monthBookings, fn($b) => $b['payment_status'] === 'Token'));
$partialCount = count(array_filter($monthBookings, fn($b) => $b['payment_status'] === 'Partial'));
$fullCount = count(array_filter($monthBookings, fn($b) => $b['payment_status'] === 'Full'));

// By project
$byProject = $pdo->prepare("
    SELECT p.name, COUNT(b.id) as cnt, SUM(b.amount) as total
    FROM bookings b
    LEFT JOIN projects p ON b.project_id = p.id
    WHERE b.booking_date BETWEEN ? AND ?
    GROUP BY b.project_id
    ORDER BY total DESC
");
$byProject->execute([$monthStart, $monthEnd]);
$projectBreakdown = $byProject->fetchAll();

include __DIR__ . '/../../includes/header.php';
?>

<div class="page-header">
  <h1>&#128176; Sales Report</h1>
  <form method="GET" style="display:flex;gap:8px;">
    <input type="month" name="month" class="form-control" value="<?= sanitize($month) ?>" onchange="this.form.submit()" style="width:auto;">
  </form>
</div>

<!-- Summary -->
<div class="stats-grid" style="grid-template-columns:repeat(auto-fit,minmax(120px,1fr));">
  <div class="stat-card green">
    <div class="stat-value"><?= count($monthBookings) ?></div>
    <div class="stat-label">Bookings</div>
  </div>
  <div class="stat-card purple">
    <div class="stat-value"><?= number_format($totalAmount / 100000, 1) ?>L</div>
    <div class="stat-label">Revenue</div>
  </div>
  <div class="stat-card orange">
    <div class="stat-value"><?= $tokenCount ?></div>
    <div class="stat-label">Token</div>
  </div>
  <div class="stat-card blue">
    <div class="stat-value"><?= $partialCount ?></div>
    <div class="stat-label">Partial</div>
  </div>
  <div class="stat-card green">
    <div class="stat-value"><?= $fullCount ?></div>
    <div class="stat-label">Full</div>
  </div>
</div>

<!-- By Project -->
<?php if (!empty($projectBreakdown)): ?>
<div class="card">
  <h3 class="card-title" style="margin-bottom:10px;">By Project</h3>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Project</th><th>Bookings</th><th>Revenue</th></tr></thead>
      <tbody>
        <?php foreach ($projectBreakdown as $pb): ?>
        <tr>
          <td><strong><?= sanitize($pb['name'] ?? 'N/A') ?></strong></td>
          <td><?= $pb['cnt'] ?></td>
          <td><?= number_format($pb['total']) ?></td>
        </tr>
        <?php endforeach; ?>
      </tbody>
    </table>
  </div>
</div>
<?php endif; ?>

<!-- Booking Details -->
<div class="card">
  <h3 class="card-title" style="margin-bottom:10px;">Booking Details</h3>
  <?php if (empty($monthBookings)): ?>
    <div class="empty-state">
      <div class="empty-icon">&#128176;</div>
      <p>No bookings for <?= date('F Y', strtotime($monthStart)) ?></p>
    </div>
  <?php else: ?>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Client</th><th>Project</th><th>Unit</th><th>Amount</th><th>Payment</th><th>By</th><th>Date</th></tr></thead>
      <tbody>
        <?php foreach ($monthBookings as $b): ?>
        <tr>
          <td>
            <strong><?= sanitize($b['lead_name']) ?></strong>
            <div class="text-sm text-muted"><?= sanitize($b['lead_phone']) ?></div>
          </td>
          <td class="text-sm"><?= sanitize($b['project_name'] ?? '-') ?></td>
          <td class="text-sm"><?= sanitize($b['unit_number'] ?: '-') ?></td>
          <td><strong><?= number_format($b['amount']) ?></strong></td>
          <td><span class="badge badge-<?= strtolower($b['payment_status']) ?>"><?= $b['payment_status'] ?></span></td>
          <td class="text-sm"><?= sanitize($b['emp_name'] ?? '-') ?></td>
          <td class="text-sm"><?= formatDate($b['booking_date']) ?></td>
        </tr>
        <?php endforeach; ?>
      </tbody>
    </table>
  </div>
  <?php endif; ?>
</div>

<?php include __DIR__ . '/../../includes/footer.php'; ?>
