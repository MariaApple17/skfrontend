'use client';

import React, { useEffect, useState } from 'react';
import { Building2, MapPin, Upload } from 'lucide-react';

import api from '@/components/lib/api';
import AlertModal from '@/components/reusable/modal/AlertModal';
import FlatInput from '@/components/reusable/ui/FlatInput';

interface SystemProfile {
  id: number;
  systemName: string;
  systemDescription?: string;
  location?: string;
  logoUrl?: string;
}

export default function SystemProfilePage() {
  const [profile, setProfile] = useState<SystemProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    systemName: '',
    systemDescription: '',
    location: '',
  });

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const [alert, setAlert] = useState<{
    open: boolean;
    type: 'success' | 'error';
    title: string;
    message: string;
  }>({
    open: false,
    type: 'success',
    title: '',
    message: '',
  });

  /* ================= LOAD PROFILE ================= */
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await api.get('/system-profile');

        if (!res.data?.success) {
          throw new Error('Failed to load profile');
        }

        const data = res.data.data as SystemProfile;

        setProfile(data);
        setForm({
          systemName: data.systemName ?? '',
          systemDescription: data.systemDescription ?? '',
          location: data.location ?? '',
        });
        setLogoPreview(data.logoUrl || null);
      } catch (err: any) {
        setAlert({
          open: true,
          type: 'error',
          title: 'Load Error',
          message:
            err?.response?.data?.message ||
            'Unable to load system profile.',
        });
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  /* ================= LOGO PREVIEW ================= */
  useEffect(() => {
    if (!logoFile) return;
    const url = URL.createObjectURL(logoFile);
    setLogoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [logoFile]);

  /* ================= SAVE ================= */
  const handleSave = async () => {
    if (!form.systemName.trim()) {
      setAlert({
        open: true,
        type: 'error',
        title: 'Validation Error',
        message: 'System name is required.',
      });
      return;
    }

    try {
      setSaving(true);

      const payload = new FormData();
      payload.append('systemName', form.systemName);
      payload.append('systemDescription', form.systemDescription);
      payload.append('location', form.location);

      if (logoFile) {
        payload.append('logo', logoFile);
      }

      const res = await api.put('/system-profile', payload);

      if (!res.data?.success) {
        throw new Error('Update failed');
      }

      setAlert({
        open: true,
        type: 'success',
        title: 'Saved',
        message:
          res.data.message ||
          'System profile updated successfully.',
      });
    } catch (err: any) {
      setAlert({
        open: true,
        type: 'error',
        title: 'Update Failed',
        message:
          err?.response?.data?.message ||
          'Failed to update system profile.',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading || !profile) return null;

  /* ================= UI ================= */
  return (
    <>
      <div className="min-h-[calc(100vh-4rem)] flex justify-center px-6 py-12 bg-slate-50">
        <div className="w-full max-w-4xl">
          {/* PROFILE HEADER */}
          <div className="mb-10 flex items-center gap-6">
            {/* LOGO */}
            <div className="relative">
              <div className="h-24 w-24 rounded-2xl bg-blue-700 text-white flex items-center justify-center shadow-lg overflow-hidden">
                {logoPreview ? (
                  <img
                    src={logoPreview}
                    alt="System Logo"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Building2 size={36} />
                )}
              </div>

              <label className="absolute -bottom-2 -right-2 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-blue-700 text-white shadow hover:bg-blue-800">
                <Upload size={14} />
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={e =>
                    setLogoFile(
                      e.target.files?.[0] || null
                    )
                  }
                />
              </label>
            </div>

            {/* TITLE */}
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                {profile.systemName}
              </h1>

              <div className="mt-1 flex items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  Global System Profile
                </span>

                {profile.location && (
                  <span className="flex items-center gap-1">
                    <MapPin size={14} />
                    {profile.location}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* CARD */}
          <div className="rounded-2xl bg-white shadow-md">
            <div className="p-8 space-y-6">
              <FlatInput
                label="System Name"
                value={form.systemName}
                onChange={e =>
                  setForm({
                    ...form,
                    systemName: e.target.value,
                  })
                }
                placeholder="Enter system name"
              />

              <FlatInput
                label="System Description"
                value={form.systemDescription}
                onChange={e =>
                  setForm({
                    ...form,
                    systemDescription: e.target.value,
                  })
                }
                placeholder="Short description"
              />

              <FlatInput
                label="Location"
                value={form.location}
                onChange={e =>
                  setForm({
                    ...form,
                    location: e.target.value,
                  })
                }
                placeholder="Barangay / City / Province"
              />
            </div>

            {/* FOOTER */}
            <div className="flex justify-end bg-slate-50 px-8 py-4 rounded-b-2xl">
              <button
                onClick={handleSave}
                disabled={saving}
                className="
                  rounded-xl bg-blue-700 px-6 py-2.5
                  text-sm font-medium text-white
                  hover:bg-blue-800 transition
                  disabled:opacity-60
                "
              >
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ALERT */}
      <AlertModal
        open={alert.open}
        type={alert.type}
        title={alert.title}
        message={alert.message}
        confirmText="OK"
        onConfirm={() =>
          setAlert({ ...alert, open: false })
        }
        onClose={() =>
          setAlert({ ...alert, open: false })
        }
      />
    </>
  );
}
