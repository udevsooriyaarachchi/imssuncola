import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserRole, User, UserPermissions } from '../types';
import { Shield, ShieldAlert, CheckCircle, Ban, Trash2, UserPlus, ShieldCheck, ToggleLeft, ToggleRight, X } from 'lucide-react';

const Team: React.FC = () => {
  const { allUsers, register, toggleUserStatus, updateUserPermissions, deleteUser, user: currentUser } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({ 
    username: '', 
    password: '', 
    role: UserRole.MEMBER,
    permissions: { 
        inventory: true, 
        invoices: true, 
        orders: false, 
        reports: false, 
        team: false 
    }
  });

  // Access check: Need 'team' permission or Superadmin
  const hasTeamAccess = currentUser?.role === UserRole.SUPERADMIN || currentUser?.permissions.team;
  
  if (!currentUser || !hasTeamAccess) {
    return (
      <div className="flex items-center justify-center h-[500px]">
        <div className="text-center p-8 bg-white rounded-[32px] shadow-sm">
            <div className="bg-red-50 p-4 rounded-full inline-block mb-4">
               <ShieldAlert className="w-12 h-12 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Access Denied</h2>
            <p className="text-gray-500 mt-2">You do not have permission to manage the team.</p>
        </div>
      </div>
    );
  }

  // Constraint: Admins cannot touch other Admins or Superadmins
  const canManageUser = (targetUser: User): boolean => {
    if (targetUser.id === currentUser.id) return false;
    if (currentUser.role === UserRole.SUPERADMIN) return true;
    if (currentUser.role === UserRole.ADMIN) {
        // Admin can only manage Members
        return targetUser.role === UserRole.MEMBER;
    }
    return false;
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if(newUser.username && newUser.password) {
      register(newUser.username, newUser.password, newUser.role, newUser.permissions);
      setIsModalOpen(false);
      setNewUser({ 
        username: '', 
        password: '', 
        role: UserRole.MEMBER, 
        permissions: { inventory: true, invoices: true, orders: false, reports: false, team: false } 
      });
    }
  };

  const togglePermission = (user: User, perm: keyof UserPermissions) => {
    const newPermissions = { ...user.permissions, [perm]: !user.permissions[perm] };
    updateUserPermissions(user.id, newPermissions);
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case UserRole.SUPERADMIN: return 'bg-purple-100 text-purple-700';
      case UserRole.ADMIN: return 'bg-indigo-100 text-indigo-700';
      default: return 'bg-blue-50 text-blue-700';
    }
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case UserRole.SUPERADMIN: return <Shield className="w-3.5 h-3.5 mr-1.5" />;
      case UserRole.ADMIN: return <ShieldCheck className="w-3.5 h-3.5 mr-1.5" />;
      default: return null;
    }
  };

  const PermissionToggle = ({ 
    label, 
    checked, 
    onChange, 
    subtext 
  }: { label: string, checked: boolean, onChange: (val: boolean) => void, subtext?: string }) => (
    <label className="flex items-center space-x-3 cursor-pointer group bg-white p-3 rounded-xl border border-gray-100 hover:border-blue-200 transition-colors">
        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${checked ? 'bg-[#007AFF] border-[#007AFF]' : 'border-gray-300 bg-white'}`}>
            {checked && <CheckCircle className="w-3.5 h-3.5 text-white" />}
        </div>
        <input 
            type="checkbox"
            className="hidden"
            checked={checked}
            onChange={e => onChange(e.target.checked)}
        />
        <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-700">{label}</span>
            {subtext && <span className="text-xs text-gray-400">{subtext}</span>}
        </div>
    </label>
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Team</h2>
           <p className="text-gray-500 mt-1">Manage members and permissions.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center px-6 py-3 bg-[#007AFF] text-white rounded-full font-semibold shadow-md shadow-blue-200 hover:opacity-90 transition-all active:scale-95"
        >
          <UserPlus className="w-5 h-5 mr-2" /> Add Member
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {allUsers.map(u => {
          const hasPermission = canManageUser(u);
          return (
          <div key={u.id} className={`bg-white p-6 rounded-[24px] shadow-sm flex flex-col justify-between transition-all hover:shadow-md border border-gray-100 ${!hasPermission && u.id !== currentUser.id ? 'opacity-60 grayscale-[50%]' : ''}`}>
            <div>
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold mr-4 text-xl shadow-sm ${
                      u.role === UserRole.SUPERADMIN ? 'bg-gradient-to-tr from-purple-500 to-indigo-600' : 
                      u.role === UserRole.ADMIN ? 'bg-indigo-500' : 'bg-[#007AFF]'
                  }`}>
                    {u.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">{u.username}</h3>
                    <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide mt-1 ${getRoleBadgeColor(u.role)}`}>
                      {getRoleIcon(u.role)}
                      {u.role}
                    </div>
                  </div>
                </div>
                {u.isActive ? (
                  <div title="Active" className="bg-green-100 p-1.5 rounded-full">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                ) : (
                  <div title="Inactive" className="bg-red-100 p-1.5 rounded-full">
                    <ShieldAlert className="w-5 h-5 text-red-600" />
                  </div>
                )}
              </div>

              {/* Permissions Section - Granular for EVERYONE now */}
              {(u.role !== UserRole.SUPERADMIN) && (
                <div className="mb-6 bg-gray-50 p-4 rounded-2xl border border-gray-100/50">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Granular Access</h4>
                  <div className="space-y-2">
                    {/* Helper to render permission row */}
                    {(Object.keys(u.permissions) as Array<keyof UserPermissions>).map(perm => (
                        <div key={perm} className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-700 capitalize">{perm}</span>
                            {hasPermission ? (
                                <button onClick={() => togglePermission(u, perm)} className={`transition-colors ${u.permissions[perm] ? 'text-[#007AFF]' : 'text-gray-300'}`}>
                                    {u.permissions[perm] ? <ToggleRight className="w-7 h-7" /> : <ToggleLeft className="w-7 h-7" />}
                                </button>
                            ) : (
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${u.permissions[perm] ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                                    {u.permissions[perm] ? 'Yes' : 'No'}
                                </span>
                            )}
                        </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-gray-100 mt-auto">
               {hasPermission ? (
                 <div className="flex space-x-3">
                  <button 
                    onClick={() => toggleUserStatus(u.id)}
                    className={`flex-1 flex items-center justify-center px-4 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 ${
                      u.isActive 
                        ? 'bg-red-50 text-red-600 hover:bg-red-100' 
                        : 'bg-green-50 text-green-600 hover:bg-green-100'
                    }`}
                  >
                    {u.isActive ? <><Ban className="w-4 h-4 mr-2" /> Block</> : <><CheckCircle className="w-4 h-4 mr-2" /> Activate</>}
                  </button>
                  <button 
                    onClick={() => { if(confirm(`Are you sure you want to delete user ${u.username}?`)) deleteUser(u.id) }}
                    className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                    title="Delete User"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                 </div>
               ) : (
                 <div className="text-center py-2">
                   {u.id === currentUser.id ? (
                      <span className="text-sm text-[#007AFF] font-bold bg-blue-50 px-4 py-1.5 rounded-full">It's You</span>
                   ) : (
                      <span className="text-xs text-gray-400 font-medium flex items-center justify-center bg-gray-50 py-2 rounded-xl">
                        <ShieldAlert className="w-3 h-3 mr-1.5" />
                        Management Restricted
                      </span>
                   )}
                 </div>
               )}
            </div>
          </div>
        )})}
      </div>

      {/* Add User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
           <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-md p-8 transform transition-all scale-100 animate-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh]">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900">Add Member</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200">
                    <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              
              <form onSubmit={handleCreateUser} className="space-y-5">
                <div>
                    <input 
                    type="text" 
                    placeholder="Username" 
                    className="w-full bg-gray-100 border-none rounded-2xl px-5 py-3.5 font-medium text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-[#007AFF] focus:bg-white transition-all outline-none"
                    required
                    value={newUser.username}
                    onChange={e => setNewUser({...newUser, username: e.target.value})}
                    />
                </div>
                <div>
                    <input 
                    type="password" 
                    placeholder="Password" 
                    className="w-full bg-gray-100 border-none rounded-2xl px-5 py-3.5 font-medium text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-[#007AFF] focus:bg-white transition-all outline-none"
                    required
                    value={newUser.password}
                    onChange={e => setNewUser({...newUser, password: e.target.value})}
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2 ml-1">Role</label>
                    <select 
                        className="w-full bg-gray-100 border-none rounded-2xl px-5 py-3.5 font-medium text-gray-900 focus:ring-2 focus:ring-[#007AFF] focus:bg-white transition-all outline-none appearance-none"
                        value={newUser.role}
                        onChange={e => {
                            // Reset defaults when switching role
                            const isNewAdmin = e.target.value === UserRole.ADMIN;
                            setNewUser(prev => ({
                                ...prev,
                                role: e.target.value as UserRole,
                                permissions: {
                                    inventory: true,
                                    invoices: true,
                                    orders: isNewAdmin,
                                    reports: isNewAdmin,
                                    team: isNewAdmin
                                }
                            }));
                        }}
                    >
                        <option value={UserRole.MEMBER}>Staff Member</option>
                        {currentUser.role === UserRole.SUPERADMIN && (
                            <option value={UserRole.ADMIN}>Admin</option>
                        )}
                    </select>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-3">Access Controls</label>
                    <div className="space-y-2">
                        <PermissionToggle 
                            label="Inventory Access"
                            subtext="Manage products & stock"
                            checked={newUser.permissions.inventory}
                            onChange={v => setNewUser(p => ({...p, permissions: {...p.permissions, inventory: v}}))}
                        />
                        <PermissionToggle 
                            label="Invoices Access"
                            subtext="Create & view invoices"
                            checked={newUser.permissions.invoices}
                            onChange={v => setNewUser(p => ({...p, permissions: {...p.permissions, invoices: v}}))}
                        />
                        <PermissionToggle 
                            label="Orders & Returns"
                            subtext="Manage POs and RMAs"
                            checked={newUser.permissions.orders}
                            onChange={v => setNewUser(p => ({...p, permissions: {...p.permissions, orders: v}}))}
                        />
                        <PermissionToggle 
                            label="Reports View"
                            subtext="Financial & Sales Reports"
                            checked={newUser.permissions.reports}
                            onChange={v => setNewUser(p => ({...p, permissions: {...p.permissions, reports: v}}))}
                        />
                        <PermissionToggle 
                            label="Team Management"
                            subtext="Add/Edit lower-level users"
                            checked={newUser.permissions.team}
                            onChange={v => setNewUser(p => ({...p, permissions: {...p.permissions, team: v}}))}
                        />
                    </div>
                </div>

                <div className="flex justify-end space-x-3 mt-8">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3.5 text-gray-500 hover:bg-gray-100 rounded-full font-bold transition-colors">Cancel</button>
                  <button type="submit" className="px-6 py-3.5 bg-[#007AFF] text-white rounded-full font-bold hover:bg-blue-600 transition-all shadow-lg shadow-blue-200 active:scale-95">Create User</button>
                </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default Team;