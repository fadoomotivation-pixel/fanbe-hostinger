<?php
require_once __DIR__ . '/../../admin/config.php';
requireRole(['sales_executive', 'telecaller']);
define('PAGE_TITLE', 'Log Follow-up');

$uid = getUserId();
$leadId = (int)($_GET['lead_id'] ?? 0);
$followupId = (int)($_GET['followup_id'] ?? 0);

// Get employee's leads for dropdown
$myLeads = $pdo->prepare("SELECT id, name, phone FROM leads WHERE assigned_to = ? AND status NOT IN ('Converted','Lost') ORDER BY name");
$myLeads->execute([$uid]);
$leads = $myLeads->fetchAll();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $lead_id = (int)$_POST['lead_id'];
    $followup_date = $_POST['followup_date'] ?? date('Y-m-d');
    $followup_time = $_POST['followup_time'] ?: null;
    $type = $_POST['type'] ?? 'Call';
    $notes = trim($_POST['notes'] ?? '');
    $status = $_POST['followup_status'] ?? 'Completed';

    if (!$lead_id) {
        flashMessage('error', 'Please select a lead');
    } else {
        // If marking an existing follow-up as completed
        if ($followupId) {
            $pdo->prepare("UPDATE followups SET status = 'Completed', notes = CONCAT(IFNULL(notes,''), '\n', ?) WHERE id = ? AND employee_id = ?")
                ->execute([$notes, $followupId, $uid]);
        }

        // Create new follow-up entry (or next follow-up)
        if ($status === 'Completed' && !empty($_POST['next_date'])) {
            // Schedule next follow-up
            $stmt = $pdo->prepare("INSERT INTO followups (lead_id, employee_id, followup_date, followup_time, type, notes, status) VALUES (?, ?, ?, ?, ?, ?, 'Pending')");
            $stmt->execute([$lead_id, $uid, $_POST['next_date'], $_POST['next_time'] ?: null, $type, 'Scheduled after: ' . $notes]);
        } elseif (!$followupId) {
            // New follow-up
            $stmt = $pdo->prepare("INSERT INTO followups (lead_id, employee_id, followup_date, followup_time, type, notes, status) VALUES (?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([$lead_id, $uid, $followup_date, $followup_time, $type, $notes, $status]);
        }

        // Update lead's updated_at
        $pdo->prepare("UPDATE leads SET updated_at = NOW() WHERE id = ?")->execute([$lead_id]);

        flashMessage('success', 'Follow-up logged!');
        redirect('/employee/followup/today.php');
    }
}

include __DIR__ . '/../../includes/header.php';
?>

<div class="page-header">
  <h1>&#128222; Log Follow-up</h1>
</div>

<div class="card">
  <form method="POST">
    <div class="form-group">
      <label>Lead *</label>
      <select name="lead_id" class="form-control" required>
        <option value="">-- Select Lead --</option>
        <?php foreach ($leads as $l): ?>
          <option value="<?= $l['id'] ?>" <?= $leadId == $l['id'] ? 'selected' : '' ?>>
            <?= sanitize($l['name']) ?> (<?= sanitize($l['phone']) ?>)
          </option>
        <?php endforeach; ?>
      </select>
    </div>

    <div class="form-row">
      <div class="form-group">
        <label>Date</label>
        <input type="date" name="followup_date" class="form-control" value="<?= date('Y-m-d') ?>">
      </div>
      <div class="form-group">
        <label>Time</label>
        <input type="time" name="followup_time" class="form-control" value="<?= date('H:i') ?>">
      </div>
    </div>

    <div class="form-row">
      <div class="form-group">
        <label>Type</label>
        <select name="type" class="form-control">
          <option value="Call">Call</option>
          <option value="WhatsApp">WhatsApp</option>
          <option value="Email">Email</option>
          <option value="Meeting">Meeting</option>
        </select>
      </div>
      <div class="form-group">
        <label>Status</label>
        <select name="followup_status" class="form-control" id="followupStatus" onchange="toggleNextDate()">
          <option value="Completed" <?= $followupId ? 'selected' : '' ?>>Completed</option>
          <option value="Pending" <?= !$followupId ? 'selected' : '' ?>>Schedule for Later</option>
        </select>
      </div>
    </div>

    <div class="form-group">
      <label>Notes</label>
      <textarea name="notes" class="form-control" rows="3" placeholder="What was discussed? Any outcome?"><?= sanitize($_POST['notes'] ?? '') ?></textarea>
    </div>

    <!-- Next Follow-up (shown when completing) -->
    <div id="nextFollowup" style="display:none;background:#f9fafb;border-radius:8px;padding:14px;margin-bottom:16px;">
      <h4 style="font-size:0.85rem;font-weight:700;margin-bottom:10px;">Schedule Next Follow-up?</h4>
      <div class="form-row">
        <div class="form-group">
          <label>Next Date</label>
          <input type="date" name="next_date" class="form-control">
        </div>
        <div class="form-group">
          <label>Next Time</label>
          <input type="time" name="next_time" class="form-control">
        </div>
      </div>
    </div>

    <button type="submit" class="btn btn-primary btn-block btn-lg">&#10004; Save Follow-up</button>
  </form>
</div>

<script>
function toggleNextDate() {
  var el = document.getElementById('nextFollowup');
  el.style.display = document.getElementById('followupStatus').value === 'Completed' ? 'block' : 'none';
}
toggleNextDate();
</script>

<?php include __DIR__ . '/../../includes/footer.php'; ?>
