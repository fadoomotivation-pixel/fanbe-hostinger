<?php
require_once __DIR__ . '/../../admin/config.php';
requireRole(['sales_executive', 'telecaller']);
define('PAGE_TITLE', 'Create Booking');

$uid = getUserId();
$leadId = (int)($_GET['lead_id'] ?? 0);

// Get employee's leads
$myLeads = $pdo->prepare("SELECT id, name, phone FROM leads WHERE assigned_to = ? AND status NOT IN ('Lost') ORDER BY name");
$myLeads->execute([$uid]);
$leads = $myLeads->fetchAll();

// Get projects
$projects = $pdo->query("SELECT id, name FROM projects WHERE status = 'Active' ORDER BY name")->fetchAll();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $lead_id = (int)$_POST['lead_id'];
    $project_id = (int)($_POST['project_id'] ?? 0) ?: null;
    $unit_number = trim($_POST['unit_number'] ?? '');
    $amount = (float)($_POST['amount'] ?? 0);
    $booking_date = $_POST['booking_date'] ?? date('Y-m-d');
    $payment_status = $_POST['payment_status'] ?? 'Token';
    $notes = trim($_POST['notes'] ?? '');

    if (!$lead_id || !$amount) {
        flashMessage('error', 'Lead and amount are required');
    } else {
        $stmt = $pdo->prepare("INSERT INTO bookings (lead_id, project_id, unit_number, amount, booking_date, payment_status, employee_id, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([$lead_id, $project_id, $unit_number, $amount, $booking_date, $payment_status, $uid, $notes]);

        // Update lead status to Converted
        $pdo->prepare("UPDATE leads SET status = 'Converted', updated_at = NOW() WHERE id = ?")->execute([$lead_id]);

        // Update project available units
        if ($project_id) {
            $pdo->prepare("UPDATE projects SET available_units = GREATEST(0, available_units - 1) WHERE id = ?")->execute([$project_id]);
        }

        flashMessage('success', 'Booking created! Lead marked as Converted.');
        redirect('/employee/dashboard.php');
    }
}

include __DIR__ . '/../../includes/header.php';
?>

<div class="page-header">
  <h1>&#128176; Create Booking</h1>
</div>

<div class="card">
  <form method="POST">
    <div class="form-group">
      <label>Lead / Client *</label>
      <select name="lead_id" class="form-control" required>
        <option value="">-- Select Lead --</option>
        <?php foreach ($leads as $l): ?>
          <option value="<?= $l['id'] ?>" <?= $leadId == $l['id'] ? 'selected' : '' ?>>
            <?= sanitize($l['name']) ?> (<?= sanitize($l['phone']) ?>)
          </option>
        <?php endforeach; ?>
      </select>
    </div>

    <div class="form-group">
      <label>Project</label>
      <select name="project_id" class="form-control">
        <option value="">-- Select Project --</option>
        <?php foreach ($projects as $p): ?>
          <option value="<?= $p['id'] ?>"><?= sanitize($p['name']) ?></option>
        <?php endforeach; ?>
      </select>
    </div>

    <div class="form-row">
      <div class="form-group">
        <label>Unit Number</label>
        <input type="text" name="unit_number" class="form-control" placeholder="e.g. A-301">
      </div>
      <div class="form-group">
        <label>Amount (INR) *</label>
        <input type="number" name="amount" class="form-control" placeholder="Booking amount" step="0.01" required>
      </div>
    </div>

    <div class="form-row">
      <div class="form-group">
        <label>Booking Date</label>
        <input type="date" name="booking_date" class="form-control" value="<?= date('Y-m-d') ?>">
      </div>
      <div class="form-group">
        <label>Payment Status</label>
        <select name="payment_status" class="form-control">
          <option value="Token">Token</option>
          <option value="Partial">Partial</option>
          <option value="Full">Full</option>
        </select>
      </div>
    </div>

    <div class="form-group">
      <label>Notes</label>
      <textarea name="notes" class="form-control" rows="2" placeholder="Any booking notes..."><?= sanitize($_POST['notes'] ?? '') ?></textarea>
    </div>

    <button type="submit" class="btn btn-primary btn-block btn-lg">&#128176; Create Booking</button>
  </form>
</div>

<?php include __DIR__ . '/../../includes/footer.php'; ?>
