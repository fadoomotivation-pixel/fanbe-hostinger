</main><!-- /main-content -->
</div><!-- /app-layout -->

<?php
$currentRole = getUserRole();
$currentPage = basename($_SERVER['PHP_SELF'], '.php');

// Mobile bottom nav for employees
if (in_array($currentRole, ['sales_executive', 'telecaller'])):
?>
<nav class="mobile-nav">
  <div class="mobile-nav-items">
    <a href="/employee/dashboard.php" class="<?= $currentPage === 'dashboard' ? 'active' : '' ?>">
      <span class="nav-icon">&#127968;</span> Home
    </a>
    <a href="/employee/leads/my-leads.php" class="<?= $currentPage === 'my-leads' ? 'active' : '' ?>">
      <span class="nav-icon">&#128203;</span> Leads
    </a>
    <a href="/employee/leads/add.php" class="<?= $currentPage === 'add' ? 'active' : '' ?>">
      <span class="nav-icon">&#10133;</span> Add
    </a>
    <a href="/employee/followup/today.php" class="<?= $currentPage === 'today' ? 'active' : '' ?>">
      <span class="nav-icon">&#128222;</span> Calls
    </a>
    <a href="/admin/settings/profile.php" class="<?= $currentPage === 'profile' ? 'active' : '' ?>">
      <span class="nav-icon">&#128100;</span> Me
    </a>
  </div>
</nav>
<?php endif; ?>

<script>
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('sidebarOverlay').classList.toggle('open');
}

// Close sidebar on link click (mobile)
document.querySelectorAll('.sidebar a').forEach(function(link) {
  link.addEventListener('click', function() {
    if (window.innerWidth <= 768) {
      document.getElementById('sidebar').classList.remove('open');
      document.getElementById('sidebarOverlay').classList.remove('open');
    }
  });
});

// Confirm delete
function confirmDelete(url, item) {
  if (confirm('Delete this ' + (item || 'item') + '? This cannot be undone.')) {
    window.location.href = url;
  }
}
</script>
</body>
</html>
