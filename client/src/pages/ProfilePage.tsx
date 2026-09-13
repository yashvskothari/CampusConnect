import { useEffect, useRef, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import Card from '../components/Card';
import Avatar from '../components/Avatar';
import Rating from '../components/Rating';
import Button from '../components/Button';
import { userApi, reviewApi } from '../services';
import { useAuth } from '../context/AuthContext';
import type { User, Review } from '../types';

interface ProfileForm {
  name: string;
  bio: string;
  skills: string;
}

interface PasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function ProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { user: currentUser, logout, updateUser } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<
    (User & {
      services?: unknown[];
      reviewsReceived?: Review[];
    }) | null
  >(null);

  const [loading, setLoading] = useState(true);

  const [showReview, setShowReview] = useState(false);

  // Profile editing
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editLoading, setEditLoading] = useState(false);

  // Password
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Avatar menu
  const [showAvatarOptions, setShowAvatarOptions] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Delete account
  const [showDeleteConfirmation, setShowDeleteConfirmation] =
    useState(false);
  const [showDeletePassword, setShowDeletePassword] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
  } = useForm<{
    rating: string;
    comment: string;
  }>();

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    reset: resetProfile,
  } = useForm<ProfileForm>();

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPassword,
    watch: watchPassword,
  } = useForm<PasswordForm>();

  const profileId = id || currentUser?.id;

  useEffect(() => {
    if (!profileId) return;

    userApi
      .getById(profileId)
      .then(({ data }) => setProfile(data))
      .catch(() => toast.error('Profile not found'))
      .finally(() => setLoading(false));
  }, [profileId]);

  /*
   * ---------------------------------------------------------
   * PROFILE EDITING
   * ---------------------------------------------------------
   */

  const openEditProfile = () => {
    if (!profile) return;

    resetProfile({
      name: profile.name || '',
      bio: profile.bio || '',
      skills: profile.skills?.join(', ') || '',
    });

    setShowEditProfile(true);
  };

  const saveProfile = async (data: ProfileForm) => {
    if (!profileId) return;

    const name = data.name.trim();

    if (!name) {
      toast.error('Name cannot be empty');
      return;
    }

    const skills = data.skills
      .split(',')
      .map((skill) => skill.trim())
      .filter(Boolean);

    setEditLoading(true);

    try {
      const { data: updatedUser } = await userApi.update(
        profileId,
        {
          name,
          bio: data.bio.trim(),
          skills,
        }
      );

      setProfile((previous) =>
        previous
          ? {
              ...previous,
              ...updatedUser,
            }
          : updatedUser
      );

      /*
       * Keep AuthContext/localStorage in sync when
       * the logged-in user's own profile is edited.
       */
      if (isOwnProfile) {
        updateUser(updatedUser);
      }

      setShowEditProfile(false);
      toast.success('Profile updated successfully');
    } catch (err: unknown) {
      const error = err as {
        response?: {
          data?: {
            error?: string;
          };
        };
      };

      toast.error(
        error.response?.data?.error ||
          'Failed to update profile'
      );
    } finally {
      setEditLoading(false);
    }
  };

  /*
   * ---------------------------------------------------------
   * CHANGE PASSWORD
   * ---------------------------------------------------------
   */

  const openChangePassword = () => {
    resetPassword({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });

    setShowChangePassword(true);
  };

  const savePassword = async (data: PasswordForm) => {
    if (data.newPassword.length < 6) {
      toast.error(
        'New password must be at least 6 characters long'
      );
      return;
    }

    if (data.newPassword !== data.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    setPasswordLoading(true);

    try {
      await userApi.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });

      setShowChangePassword(false);
      resetPassword();

      toast.success('Password changed successfully');
    } catch (err: unknown) {
      const error = err as {
        response?: {
          data?: {
            error?: string;
          };
        };
      };

      toast.error(
        error.response?.data?.error ||
          'Failed to change password'
      );
    } finally {
      setPasswordLoading(false);
    }
  };

  /*
   * ---------------------------------------------------------
   * PROFILE PICTURE
   * ---------------------------------------------------------
   */

  const openAvatarOptions = () => {
    if (!isOwnProfile || avatarLoading) return;

    setShowAvatarOptions(true);
  };

  const selectAvatarFile = () => {
    setShowAvatarOptions(false);
    avatarInputRef.current?.click();
  };

  const handleAvatarChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    /*
     * Reset input so the same file can be selected again.
     */
    event.target.value = '';

    if (!file) return;

    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
    ];

    if (!allowedTypes.includes(file.type)) {
      toast.error(
        'Please select a JPG, PNG or WEBP image'
      );
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Profile picture must be smaller than 5 MB');
      return;
    }

    setAvatarLoading(true);

    try {
      const { data: updatedUser } =
        await userApi.uploadAvatar(file);

      setProfile((previous) =>
        previous
          ? {
              ...previous,
              ...updatedUser,
            }
          : updatedUser
      );

      if (isOwnProfile) {
        updateUser(updatedUser);
      }

      toast.success('Profile picture updated');
    } catch (err: unknown) {
      const error = err as {
        response?: {
          data?: {
            error?: string;
          };
        };
      };

      toast.error(
        error.response?.data?.error ||
          'Failed to update profile picture'
      );
    } finally {
      setAvatarLoading(false);
    }
  };

  const removeAvatar = async () => {
    setShowAvatarOptions(false);

    if (!profile?.avatar) {
      toast.error('You do not have a profile picture');
      return;
    }

    setAvatarLoading(true);

    try {
      const { data: updatedUser } =
        await userApi.removeAvatar();

      setProfile((previous) =>
        previous
          ? {
              ...previous,
              ...updatedUser,
            }
          : updatedUser
      );

      if (isOwnProfile) {
        updateUser(updatedUser);
      }

      toast.success('Profile picture removed');
    } catch (err: unknown) {
      const error = err as {
        response?: {
          data?: {
            error?: string;
          };
        };
      };

      toast.error(
        error.response?.data?.error ||
          'Failed to remove profile picture'
      );
    } finally {
      setAvatarLoading(false);
    }
  };

  /*
   * ---------------------------------------------------------
   * DELETE ACCOUNT
   * ---------------------------------------------------------
   */

  const openDeletePasswordPrompt = () => {
    setShowDeleteConfirmation(false);
    setDeletePassword('');
    setShowDeletePassword(true);
  };

  const deleteAccount = async () => {
    if (!deletePassword) {
      toast.error('Please enter your password');
      return;
    }

    setDeleteLoading(true);

    try {
      await userApi.deleteAccount(deletePassword);

      toast.success(
        'Your account has been permanently deleted.'
      );

      logout();

      navigate('/login', {
        replace: true,
      });
    } catch (err: unknown) {
      const error = err as {
        response?: {
          data?: {
            error?: string;
          };
        };
      };

      toast.error(
        error.response?.data?.error ||
          'Failed to delete account'
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  /*
   * ---------------------------------------------------------
   * REVIEWS
   * ---------------------------------------------------------
   */

  const onReview = async (data: {
    rating: string;
    comment: string;
  }) => {
    if (!profileId) return;

    try {
      await reviewApi.create({
        revieweeId: profileId,
        rating: Number(data.rating),
        comment: data.comment,
      });

      toast.success('Review submitted!');

      setShowReview(false);
      reset();

      const { data: updated } =
        await userApi.getById(profileId);

      setProfile(updated);
    } catch (err: unknown) {
      const error = err as {
        response?: {
          data?: {
            error?: string;
          };
        };
      };

      toast.error(
        error.response?.data?.error ||
          'Failed to submit review'
      );
    }
  };

  /*
   * ---------------------------------------------------------
   * LOADING / PROFILE
   * ---------------------------------------------------------
   */

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="py-20 text-center">
        Profile not found
      </div>
    );
  }

  const isOwnProfile =
    currentUser?.id === profile.id;

  const passwordValue = watchPassword('newPassword');

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">

      {/* =====================================================
          PROFILE HEADER
      ====================================================== */}

      <Card>
        <div className="flex flex-col items-start gap-6 sm:flex-row">

          <div className="relative">
            <Avatar
              name={profile.name}
              src={profile.avatar}
              size="lg"
              editable={isOwnProfile}
              onEdit={openAvatarOptions}
            />

            {avatarLoading && (
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/60">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
              </div>
            )}

            {isOwnProfile && (
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                className="hidden"
                onChange={handleAvatarChange}
              />
            )}
          </div>

          <div className="flex-1">

            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">

              <div>
                <h1 className="text-2xl font-bold text-surface-900">
                  {profile.name}
                </h1>

                <p className="text-sm text-primary-400 capitalize">
                  {profile.role.toLowerCase()}
                </p>

                <div className="mt-1">
                  <Rating
                    rating={profile.rating}
                    size={18}
                    showValue
                  />
                </div>
              </div>

              {isOwnProfile && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={openEditProfile}
                  >
                    Edit Profile
                  </Button>

                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={openChangePassword}
                  >
                    Change Password
                  </Button>
                </div>
              )}
            </div>

            {profile.bio && (
              <p className="mt-3 text-surface-800">
                {profile.bio}
              </p>
            )}

            {profile.skills.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {profile.skills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full bg-primary-500/10 px-3 py-1 text-xs font-medium text-primary-300"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            )}

            {!isOwnProfile && currentUser && (
              <div className="mt-4 flex gap-2">
                <Link
                  to={`/messages?user=${profile.id}`}
                >
                  <Button
                    size="sm"
                    variant="outline"
                  >
                    Message
                  </Button>
                </Link>

                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() =>
                    setShowReview(!showReview)
                  }
                >
                  Leave Review
                </Button>
              </div>
            )}
          </div>
        </div>
      </Card>


      {/* =====================================================
          REVIEW FORM
      ====================================================== */}

      {showReview && (
        <Card className="mt-6">
          <h3 className="mb-4 font-semibold">
            Write a Review
          </h3>

          <form
            onSubmit={handleSubmit(onReview)}
            className="space-y-4"
          >
            <div>
              <label className="mb-1 block text-sm font-medium">
                Rating
              </label>

              <select
                {...register('rating')}
                className="rounded-lg border border-surface-400 px-3 py-2 text-sm"
                defaultValue="5"
              >
                {[5, 4, 3, 2, 1].map((r) => (
                  <option
                    key={r}
                    value={r}
                  >
                    {r} Stars
                  </option>
                ))}
              </select>
            </div>

            <textarea
              {...register('comment', {
                required: true,
              })}
              rows={3}
              placeholder="Share your experience..."
              className="w-full rounded-lg border border-surface-400 px-3 py-2 text-sm"
            />

            <Button
              type="submit"
              size="sm"
            >
              Submit Review
            </Button>
          </form>
        </Card>
      )}


      {/* =====================================================
          DELETE ACCOUNT
      ====================================================== */}

      {isOwnProfile && (
        <Card className="mt-8 border border-red-500/20">

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <h2 className="text-lg font-semibold text-surface-900">
                Delete Account
              </h2>

              <p className="mt-1 text-sm text-surface-700">
                Permanently delete your Gigverse account
                and all associated data. This action
                cannot be undone.
              </p>
            </div>

            <Button
              type="button"
              size="sm"
              variant="danger"
              onClick={() =>
                setShowDeleteConfirmation(true)
              }
            >
              Delete Account Permanently
            </Button>
          </div>
        </Card>
      )}


      {/* =====================================================
          EDIT PROFILE MODAL
      ====================================================== */}

      {showEditProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">

          <div className="w-full max-w-lg rounded-2xl border border-surface-400 bg-surface-100 p-6 shadow-2xl">

            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-surface-900">
                Edit Profile
              </h2>

              <button
                type="button"
                onClick={() =>
                  setShowEditProfile(false)
                }
                className="text-xl text-surface-600 transition hover:text-surface-900"
              >
                ×
              </button>
            </div>

            <form
              onSubmit={handleProfileSubmit(saveProfile)}
              className="mt-6 space-y-5"
            >

              <div>
                <label
                  htmlFor="profile-name"
                  className="mb-1 block text-sm font-medium text-surface-900"
                >
                  Username / Name
                </label>

                <input
                  id="profile-name"
                  {...registerProfile('name', {
                    required: true,
                  })}
                  className="w-full rounded-lg border border-surface-400 bg-surface-0 px-3 py-2.5 text-sm text-surface-900 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                  placeholder="Enter your name"
                />
              </div>

              <div>
                <label
                  htmlFor="profile-bio"
                  className="mb-1 block text-sm font-medium text-surface-900"
                >
                  Bio
                </label>

                <textarea
                  id="profile-bio"
                  {...registerProfile('bio')}
                  rows={4}
                  className="w-full resize-none rounded-lg border border-surface-400 bg-surface-0 px-3 py-2.5 text-sm text-surface-900 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                  placeholder="Tell people a little about yourself..."
                />
              </div>

              <div>
                <label
                  htmlFor="profile-skills"
                  className="mb-1 block text-sm font-medium text-surface-900"
                >
                  Skills
                </label>

                <input
                  id="profile-skills"
                  {...registerProfile('skills')}
                  className="w-full rounded-lg border border-surface-400 bg-surface-0 px-3 py-2.5 text-sm text-surface-900 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                  placeholder="React, Node.js, Python"
                />

                <p className="mt-1 text-xs text-surface-600">
                  Separate multiple skills with commas.
                </p>
              </div>

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  disabled={editLoading}
                  onClick={() =>
                    setShowEditProfile(false)
                  }
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  loading={editLoading}
                >
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* =====================================================
          AVATAR OPTIONS MODAL
      ====================================================== */}

      {showAvatarOptions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">

          <div className="w-full max-w-sm rounded-2xl border border-surface-400 bg-surface-100 p-6 shadow-2xl">

            <h2 className="text-xl font-bold text-surface-900">
              Profile Picture
            </h2>

            <p className="mt-2 text-sm text-surface-700">
              Choose what you want to do with your profile picture.
            </p>

            <div className="mt-6 space-y-3">

              <Button
                type="button"
                className="w-full"
                onClick={selectAvatarFile}
              >
                {profile.avatar
                  ? 'Change Profile Picture'
                  : 'Upload Profile Picture'}
              </Button>

              {profile.avatar && (
                <Button
                  type="button"
                  variant="danger"
                  className="w-full"
                  onClick={removeAvatar}
                  loading={avatarLoading}
                >
                  Remove Profile Picture
                </Button>
              )}

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() =>
                  setShowAvatarOptions(false)
                }
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}


      {/* =====================================================
          CHANGE PASSWORD MODAL
      ====================================================== */}

      {showChangePassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">

          <div className="w-full max-w-md rounded-2xl border border-surface-400 bg-surface-100 p-6 shadow-2xl">

            <h2 className="text-xl font-bold text-surface-900">
              Change Password
            </h2>

            <p className="mt-2 text-sm text-surface-700">
              Enter your current password and choose a
              new password.
            </p>

            <form
              onSubmit={handlePasswordSubmit(savePassword)}
              className="mt-6 space-y-4"
            >

              <div>
                <label
                  htmlFor="current-password"
                  className="mb-1 block text-sm font-medium text-surface-900"
                >
                  Current Password
                </label>

                <input
                  id="current-password"
                  type="password"
                  autoComplete="current-password"
                  {...registerPassword(
                    'currentPassword',
                    {
                      required: true,
                    }
                  )}
                  className="w-full rounded-lg border border-surface-400 bg-surface-0 px-3 py-2.5 text-sm text-surface-900 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                  placeholder="Enter current password"
                />
              </div>

              <div>
                <label
                  htmlFor="new-password"
                  className="mb-1 block text-sm font-medium text-surface-900"
                >
                  New Password
                </label>

                <input
                  id="new-password"
                  type="password"
                  autoComplete="new-password"
                  {...registerPassword(
                    'newPassword',
                    {
                      required: true,
                      minLength: 6,
                    }
                  )}
                  className="w-full rounded-lg border border-surface-400 bg-surface-0 px-3 py-2.5 text-sm text-surface-900 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                  placeholder="Minimum 6 characters"
                />
              </div>

              <div>
                <label
                  htmlFor="confirm-password"
                  className="mb-1 block text-sm font-medium text-surface-900"
                >
                  Confirm New Password
                </label>

                <input
                  id="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  {...registerPassword(
                    'confirmPassword',
                    {
                      required: true,
                      validate: (value) =>
                        value === passwordValue ||
                        'Passwords do not match',
                    }
                  )}
                  className="w-full rounded-lg border border-surface-400 bg-surface-0 px-3 py-2.5 text-sm text-surface-900 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                  placeholder="Confirm new password"
                />
              </div>

              <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  disabled={passwordLoading}
                  onClick={() => {
                    setShowChangePassword(false);
                    resetPassword();
                  }}
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  loading={passwordLoading}
                >
                  Change Password
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* =====================================================
          DELETE CONFIRMATION MODAL
      ====================================================== */}

      {showDeleteConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">

          <div className="w-full max-w-md rounded-2xl border border-surface-400 bg-surface-100 p-6 shadow-2xl">

            <h2 className="text-xl font-bold text-surface-900">
              Delete your account?
            </h2>

            <p className="mt-3 text-sm leading-6 text-surface-700">
              This will permanently delete your profile,
              services, jobs, bids, messages, reviews, and
              other account data. You will not be able to
              recover your account afterward.
            </p>

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">

              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  setShowDeleteConfirmation(false)
                }
              >
                Cancel
              </Button>

              <Button
                type="button"
                variant="danger"
                onClick={openDeletePasswordPrompt}
              >
                Continue
              </Button>
            </div>
          </div>
        </div>
      )}


      {/* =====================================================
          DELETE PASSWORD MODAL
      ====================================================== */}

      {showDeletePassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">

          <div className="w-full max-w-md rounded-2xl border border-surface-400 bg-surface-100 p-6 shadow-2xl">

            <h2 className="text-xl font-bold text-surface-900">
              Confirm account deletion
            </h2>

            <p className="mt-3 text-sm text-surface-700">
              For your security, enter your current password
              to permanently delete your account.
            </p>

            <label
              htmlFor="delete-account-password"
              className="mt-5 block text-sm font-medium text-surface-900"
            >
              Password
            </label>

            <input
              id="delete-account-password"
              type="password"
              value={deletePassword}
              onChange={(event) =>
                setDeletePassword(event.target.value)
              }
              onKeyDown={(event) => {
                if (
                  event.key === 'Enter' &&
                  !deleteLoading
                ) {
                  deleteAccount();
                }
              }}
              autoComplete="current-password"
              autoFocus
              placeholder="Enter your password"
              className="mt-2 w-full rounded-lg border border-surface-400 bg-surface-0 px-3 py-2.5 text-sm text-surface-900 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
            />

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">

              <Button
                type="button"
                variant="outline"
                disabled={deleteLoading}
                onClick={() => {
                  setShowDeletePassword(false);
                  setDeletePassword('');
                }}
              >
                Cancel
              </Button>

              <Button
                type="button"
                variant="danger"
                loading={deleteLoading}
                onClick={deleteAccount}
              >
                Permanently Delete
              </Button>
            </div>
          </div>
        </div>
      )}


      {/* =====================================================
          REVIEWS
      ====================================================== */}

      {profile.reviewsReceived &&
        profile.reviewsReceived.length > 0 && (
          <div className="mt-8">

            <h2 className="mb-4 text-xl font-bold">
              Reviews
            </h2>

            <div className="space-y-4">
              {profile.reviewsReceived.map(
                (review) => (
                  <Card key={review.id}>

                    <div className="mb-2 flex items-center gap-3">

                      {review.reviewer && (
                        <Avatar
                          name={review.reviewer.name}
                          src={review.reviewer.avatar}
                          size="sm"
                        />
                      )}

                      <div>
                        <p className="text-sm font-medium">
                          {review.reviewer?.name}
                        </p>

                        <Rating
                          rating={review.rating}
                          size={14}
                        />
                      </div>
                    </div>

                    <p className="text-sm text-surface-800">
                      {review.comment}
                    </p>
                  </Card>
                )
              )}
            </div>
          </div>
        )}
    </div>
  );
}