import { useEffect, useState } from "react";
import {
  BellOff,
  CheckCircle2,
  LoaderCircle,
  Search,
  ShieldCheck,
  Trash2,
  Users as UsersIcon,
} from "lucide-react";

import ConfirmDialog from "../components/ConfirmDialog";
import GlassCard from "../components/GlassCard";
import { useAuth } from "../context/AuthContext.jsx";
import { userApi } from "../services/api";

function UsersPage() {
  const { user: currentUser, masterAdminEmail } = useAuth();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState("");
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      setError("");
      const response = await userApi.getAll();
      const data = Array.isArray(response.data)
        ? response.data
        : response.data?.data ?? [];
      setUsers(data);
    } catch (requestError) {
      console.error("Failed to load users:", requestError);
      setError("Unable to load users. Check that the User API is available.");
    } finally {
      setLoading(false);
    }
  }

  async function updateRole(user, role) {
    const userId = user.userId ?? user.id;
    if (!userId) return;

    try {
      setSavingId(userId);
      setError("");
      await userApi.update(userId, { ...user, role });
      setUsers((currentUsers) =>
        currentUsers.map((listUser) =>
          (listUser.userId ?? listUser.id) === userId
            ? { ...listUser, role }
            : listUser
        )
      );
    } catch (requestError) {
      console.error("Failed to update user role:", requestError);
      setError(
        requestError.response?.data?.message ??
          "Unable to update this user's role."
      );
    } finally {
      setSavingId(null);
    }
  }

  async function toggleActive(user) {
    const userId = user.userId ?? user.id;
    if (!userId) return;

    const nextActive = !(user.isActive ?? true);

    try {
      setSavingId(userId);
      setError("");
      await userApi.update(userId, { ...user, isActive: nextActive });
      setUsers((currentUsers) =>
        currentUsers.map((listUser) =>
          (listUser.userId ?? listUser.id) === userId
            ? { ...listUser, isActive: nextActive }
            : listUser
        )
      );
    } catch (requestError) {
      console.error("Failed to update account status:", requestError);
      setError(
        requestError.response?.data?.message ??
          "Unable to change this account's status."
      );
    } finally {
      setSavingId(null);
    }
  }

  async function handleDelete() {
    const userId = pendingDelete?.userId ?? pendingDelete?.id;
    if (!userId) return;

    try {
      setDeleting(true);
      setDeleteError("");
      await userApi.delete(userId);
      setPendingDelete(null);
      await loadUsers();
    } catch (requestError) {
      console.error("Failed to delete user:", requestError);
      setDeleteError(
        requestError.response?.data?.message ?? "Unable to delete this user."
      );
    } finally {
      setDeleting(false);
    }
  }

  const filteredUsers = users.filter((user) => {
    const text = `${user.fullName ?? user.name ?? ""} ${user.email ?? ""}`;
    return text.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <span className="eyebrow">ADMINISTRATION</span>
          <h2>Users</h2>
          <p>Manage users and their system roles.</p>
        </div>
      </div>

      <div className="glass-card toolbar">
        <div className="search-box">
          <Search size={18} />
          <input
            placeholder="Search users..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      </div>

      <GlassCard>
        {loading ? (
          <div className="empty-state large">
            <LoaderCircle className="spinner" size={38} />
            <p>Loading users...</p>
          </div>
        ) : error && users.length === 0 ? (
          <div className="empty-state large">
            <UsersIcon size={55} />
            <h3>Users unavailable</h3>
            <p>{error}</p>
            <button className="secondary-button" onClick={loadUsers}>
              Try Again
            </button>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="empty-state large">
            <UsersIcon size={55} />
            <h3>No users found</h3>
            <p>Users appear automatically after they sign in.</p>
          </div>
        ) : (
          <div className="table-container">
            {error && <p className="form-error">{error}</p>}
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Created</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user, index) => {
                  const userId = user.userId ?? user.id ?? index;
                  const role = user.role ?? "Teacher";
                  const isSelf =
                    Boolean(currentUser?.email) &&
                    user.email?.toLowerCase() ===
                      currentUser.email.toLowerCase();

                  // The master admin cannot be demoted or removed by anyone.
                  const isMaster =
                    user.email?.toLowerCase() ===
                    masterAdminEmail?.toLowerCase();

                  return (
                    <tr key={userId}>
                      <td>{user.fullName ?? user.name ?? "-"}</td>
                      <td>{user.email ?? "-"}</td>
                      <td>
                        <label className="role-control">
                          <ShieldCheck size={15} />
                          <select
                            value={isMaster ? "Admin" : role}
                            disabled={savingId === userId || isMaster}
                            title={
                              isMaster
                                ? "The master admin's role is fixed"
                                : "Change this user's role"
                            }
                            onChange={(event) =>
                              updateRole(user, event.target.value)
                            }
                          >
                            <option value="Teacher">Teacher</option>
                            <option value="Admin">
                              {isMaster ? "Master Admin" : "Admin"}
                            </option>
                          </select>
                        </label>
                      </td>
                      <td>
                        {user.createdAt
                          ? new Date(user.createdAt).toLocaleDateString()
                          : "-"}
                      </td>
                      <td>
                        <span
                          className={`status ${
                            user.isActive ?? true ? "available" : "unavailable"
                          }`}
                        >
                          {user.isActive ?? true ? "Active" : "Suspended"}
                        </span>
                      </td>
                      <td>
                        <div className="table-actions">
                          <button
                            className="action-button edit"
                            title={
                              isMaster
                                ? "The master admin cannot be suspended"
                                : user.isActive ?? true
                                  ? "Suspend this account"
                                  : "Reactivate this account"
                            }
                            disabled={isMaster || savingId === userId}
                            onClick={() => toggleActive(user)}
                          >
                            {user.isActive ?? true ? (
                              <BellOff size={15} />
                            ) : (
                              <CheckCircle2 size={15} />
                            )}
                          </button>

                          <button
                            className="action-button delete"
                            title={
                              isMaster
                                ? "The master admin cannot be deleted"
                                : isSelf
                                  ? "You cannot delete your own account"
                                  : "Delete user"
                            }
                            disabled={isSelf || isMaster}
                            onClick={() => {
                              setDeleteError("");
                              setPendingDelete(user);
                            }}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>

      <ConfirmDialog
        isOpen={Boolean(pendingDelete)}
        title="Delete user"
        message={`Delete ${
          pendingDelete?.fullName ?? pendingDelete?.email ?? "this user"
        }? Their finished request history is removed too. A user with a pending or approved request cannot be deleted.`}
        working={deleting}
        error={deleteError}
        onConfirm={handleDelete}
        onCancel={() => !deleting && setPendingDelete(null)}
      />
    </div>
  );
}

export default UsersPage;
