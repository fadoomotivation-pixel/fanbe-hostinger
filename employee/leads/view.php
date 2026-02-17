<?php
require_once __DIR__ . '/../../admin/config.php';
requireRole(['sales_executive', 'telecaller', 'manager', 'sub_admin', 'super_admin']);
define('PAGE_TITLE', 'Lead Details');

$uid = getUserId();
$role = getUserRole();
$leadId = (int)($_GET['id'] ?? 0);

if (!$leadId) redirect('/employee/leads/my-leads.php');

// Get lead
$stmt = $pdo->prepare("SELECT l.*, p.name AS project_name, u.full_name AS assigned_name, c.full_name AS created_name FROM leads l LEFT JOIN projects p ON l.project_interest = p.id LEFT JOIN users u ON l.assigned_to = u.id LEFT JOIN users c ON l.created_by = c.id WHERE l.id = ?");
$stmt->execute([$leadId]);
$lead = $stmt->fetch();

if (!$lead) { flashMessage('error', 'Lead not found'); redirect('/employee/leads/my-leads.php'); }

// Check access: employees can only see their own leads
if (in_array($role, ['sales_executive', 'telecaller']) && $lead['assigned_to'] != $uid) {
    flashMessage('error', 'Access denied');
    redirect('/employee/leads/my-leads.php');
}

// Handle status update
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['update_status'])) {
    $newStatus = $_POST['status'];
    $pdo->prepare("UPDATE leads SET status = ? WHERE id = ?")->execute([$newStatus, $leadId]);
    flashMessage('success', 'Status updated');
    redirect("/employee/leads/view.php?id=$leadId");
}

// Handle note add
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['add_note'])) {
    $note = trim($_POST['note'] ?? '');
    if ($note) {
        $existingNotes = $lead['notes'] ?? '';
        $timestamp = date('d M Y h:i A');
        $userName = getUserName();
        $newNote = "[$timestamp - $userName] $note";
        $updatedNotes = $existingNotes ? "$existingNotes\n$newNote" : $newNote;
        $pdo->prepare("UPDATE leads SET notes = ? WHERE id = ?")->execute([$updatedNotes, $leadId]);
        flashMessage('success', 'Note added');
        redirect("/employee/leads/view.php?id=$leadId");
    }
}

// Get follow-up history
$followupHistory = $pdo->prepare("SELECT f.*, u.full_name AS emp_name FROM followups f LEFT JOIN users u ON f.employee_id = u.id WHERE f.lead_id = ? ORDER BY f.created_at DESC LIMIT 10");
$followupHistory->execute([$leadId]);
$followupHist = $followupHistory->fetchAll();

// Get site visit history
$visitHistory = $pdo->prepare("SELECT sv.*, u.full_name AS emp_name, p.name AS project_name FROM site_visits sv LEFT JOIN users u ON sv.employee_id = u.id LEFT JOIN projects p ON sv.project_id = p.id WHERE sv.lead_id = ? ORDER BY sv.created_at DESC LIMIT 10");
$visitHistory->execute([$leadId]);
$visitHist = $visitHistory->fetchAll();

include __DIR__ . '/../../includes/header.php';
?>

<div class="page-header">
  <h1>&#128100; <?= sanitize($lead['name']) ?></h1>
  <span class="badge badge-<?= strtolower($lead['status']) ?>" style="font-size:0.85rem;padding:5px 14px;"><?= $lead['status'] ?></span>
</div>

<!-- Lead Info Card -->
<div class="card">
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;font-size:0.88rem;">
    <div><strong>Phone:</strong> <a href="tel:<?= sanitize($lead['phone']) ?>"><?= sanitize($lead['phone']) ?></a></div>
    <div><strong>Email:</strong> <?= sanitize($lead['email'] ?: '-') ?></div>
    <div><strong>Source:</strong> <?= sanitize($lead['source']) ?></div>
    <div><strong>Project:</strong> <?= sanitize($lead['project_name'] ?? '-') ?></div>
    <div><strong>Assigned:</strong> <?= sanitize($lead['assigned_name'] ?? '-') ?></div>
    <div><strong>Created:</strong> <?= formatDate($lead['created_at']) ?></div>
  </div>

  <!-- Quick Actions -->
  <div style="display:flex;gap:8px;margin-top:16px;flex-wrap:wrap;">
    <a href="tel:<?= sanitize($lead['phone']) ?>" class="btn btn-success btn-sm">&#128222; Call</a>
    <a href="/employee/followup/add.php?lead_id=<?= $lead['id'] ?>" class="btn btn-primary btn-sm">&#128221; Follow-up</a>
    <a href="/employee/site-visits/schedule.php?lead_id=<?= $lead['id'] ?>" class="btn btn-outline btn-sm">&#127968; Schedule Visit</a>
    <a href="/employee/bookings/create.php?lead_id=<?= $lead['id'] ?>" class="btn btn-outline btn-sm">&#128176; Create Booking</a>
  </div>
</div>

<!-- Update Status -->
<div class="card">
  <h3 class="card-title" style="margin-bottom:10px;">Update Status</h3>
  <form method="POST" style="display:flex;gap:8px;">
    <select name="status" class="form-control" style="flex:1;">
      <?php foreach (['New','Hot','Warm','Cold','Converted','Lost'] as $s): ?>
        <option value="<?= $s ?>" <?= $lead['status'] === $s ? 'selected' : '' ?>><?= $s ?></option>
      <?php endforeach; ?>
    </select>
    <button type="submit" name="update_status" class="btn btn-primary btn-sm">Update</button>
  </form>
</div>

<!-- Add Note -->
<div class="card">
  <h3 class="card-title" style="margin-bottom:10px;">&#128221; Add Note</h3>
  <form method="POST">
    <div class="form-group" style="margin-bottom:10px;">
      <textarea name="note" class="form-control" rows="2" placeholder="Type a quick note..." required></textarea>
    </div>
    <button type="submit" name="add_note" class="btn btn-primary btn-sm">Add Note</button>
  </form>
  <?php if ($lead['notes']): ?>
    <div style="margin-top:12px;padding-top:12px;border-top:1px solid #f0f0f0;">
      <div class="text-sm" style="white-space:pre-line;color:#4b5563;"><?= sanitize($lead['notes']) ?></div>
    </div>
  <?php endif; ?>
</div>

<!-- Follow-up History -->
<div class="card">
  <h3 class="card-title" style="margin-bottom:10px;">&#128222; Follow-up History</h3>
  <?php if (empty($followupHist)): ?>
    <p class="text-sm text-muted">No follow-ups recorded</p>
  <?php else: ?>
    <?php foreach ($followupHist as $f): ?>
    <div style="padding:8px 0;border-bottom:1px solid #f0f0f0;font-size:0.85rem;">
      <div class="flex-between">
        <strong><?= formatDate($f['followup_date']) ?> <?= $f['followup_time'] ? date('h:i A', strtotime($f['followup_time'])) : '' ?></strong>
        <span class="badge badge-<?= strtolower($f['status']) ?>"><?= $f['status'] ?></span>
      </div>
      <?php if ($f['notes']): ?>
        <div class="text-sm text-muted" style="margin-top:3px;"><?= sanitize($f['notes']) ?></div>
      <?php endif; ?>
      <div class="text-sm text-muted">by <?= sanitize($f['emp_name'] ?? 'Unknown') ?> &middot; <?= sanitize($f['type'] ?? 'Call') ?></div>
    </div>
    <?php endforeach; ?>
  <?php endif; ?>
</div>

<!-- Site Visit History -->
<?php if (!empty($visitHist)): ?>
<div class="card">
  <h3 class="card-title" style="margin-bottom:10px;">&#127968; Site Visit History</h3>
  <?php foreach ($visitHist as $v): ?>
  <div style="padding:8px 0;border-bottom:1px solid #f0f0f0;font-size:0.85rem;">
    <div class="flex-between">
      <strong><?= formatDate($v['visit_date']) ?> <?= $v['visit_time'] ? date('h:i A', strtotime($v['visit_time'])) : '' ?></strong>
      <span class="badge badge-<?= strtolower($v['status']) ?>"><?= $v['status'] ?></span>
    </div>
    <div class="text-sm text-muted"><?= sanitize($v['project_name'] ?? 'N/A') ?> &middot; <?= sanitize($v['emp_name'] ?? '') ?></div>
    <?php if ($v['feedback']): ?>
      <div class="text-sm" style="margin-top:3px;color:#4b5563;"><?= sanitize($v['feedback']) ?></div>
    <?php endif; ?>
  </div>
  <?php endforeach; ?>
</div>
<?php endif; ?>

<?php include __DIR__ . '/../../includes/footer.php'; ?>
