<script lang="ts">
  import { getAuthStatus, setupTotp, enableTotp, disableTotp, type TotpSetupResponseDto } from '@immich/sdk';
  import { Alert, Button, Field, Input, PasswordInput, Stack } from '@immich/ui';
  import { handleError } from '$lib/utils/handle-error';
  import { t } from 'svelte-i18n';
  import { onMount } from 'svelte';

  let totpEnabled = $state(false);
  let loading = $state(false);
  let setupMode = $state(false);
  let totpSetup: TotpSetupResponseDto | null = $state(null);
  let password = $state('');
  let totpCode = $state('');
  let errorMessage = $state('');
  let successMessage = $state('');

  onMount(async () => {
    try {
      const status = await getAuthStatus();
      totpEnabled = status.totpEnabled;
    } catch (error) {
      handleError(error, $t('errors.unable_to_load_auth_status'));
    }
  });

  const handleSetup = async () => {
    try {
      errorMessage = '';
      loading = true;
      totpSetup = await setupTotp({ totpSetupDto: { password } });
      setupMode = true;
      password = '';
    } catch (error) {
      errorMessage = $t('errors.unable_to_setup_totp');
      handleError(error, errorMessage);
    } finally {
      loading = false;
    }
  };

  const handleEnable = async () => {
    if (!totpSetup) return;
    
    try {
      errorMessage = '';
      loading = true;
      await enableTotp({ totpEnableDto: { secret: totpSetup.secret, code: totpCode } });
      totpEnabled = true;
      setupMode = false;
      totpSetup = null;
      totpCode = '';
      successMessage = $t('totp_enabled_successfully');
    } catch (error) {
      errorMessage = $t('errors.invalid_totp_code');
      handleError(error, errorMessage);
    } finally {
      loading = false;
    }
  };

  const handleDisable = async () => {
    try {
      errorMessage = '';
      loading = true;
      await disableTotp({ totpDisableDto: { password } });
      totpEnabled = false;
      password = '';
      successMessage = $t('totp_disabled_successfully');
    } catch (error) {
      errorMessage = $t('errors.unable_to_disable_totp');
      handleError(error, errorMessage);
    } finally {
      loading = false;
    }
  };

  const cancelSetup = () => {
    setupMode = false;
    totpSetup = null;
    password = '';
    totpCode = '';
    errorMessage = '';
  };
</script>

<Stack gap={4}>
  <div class="text-immich-primary dark:text-immich-dark-primary text-lg">
    {$t('two_factor_authentication')}
  </div>

  {#if successMessage}
    <Alert color="success" title={successMessage} closable onclose={() => (successMessage = '')} />
  {/if}

  {#if errorMessage}
    <Alert color="danger" title={errorMessage} closable onclose={() => (errorMessage = '')} />
  {/if}

  {#if !totpEnabled && !setupMode}
    <div class="text-sm">
      {$t('totp_description')}
    </div>

    <form onsubmit={(e) => { e.preventDefault(); handleSetup(); }} class="flex flex-col gap-4">
      <Field label={$t('password')} required="indicator">
        <PasswordInput id="password" bind:value={password} autocomplete="current-password" />
      </Field>

      <Button type="submit" size="large" {loading}>
        {$t('setup_two_factor_authentication')}
      </Button>
    </form>
  {/if}

  {#if setupMode && totpSetup}
    <div class="flex flex-col gap-4">
      <div class="text-sm">
        {$t('scan_qr_code_with_authenticator_app')}
      </div>

      <div class="flex justify-center p-4 bg-white dark:bg-gray-800 rounded-lg">
        <img src={totpSetup.qrCode} alt="TOTP QR Code" class="w-64 h-64" />
      </div>

      <div class="text-sm">
        {$t('or_enter_secret_manually')}: <code class="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">{totpSetup.secret}</code>
      </div>

      <Field label={$t('verification_code')} required="indicator">
        <Input
          id="totpCode"
          bind:value={totpCode}
          placeholder="000000"
          maxlength={6}
          pattern="[0-9]{6}"
        />
      </Field>

      <div class="flex gap-2">
        <Button type="button" color="secondary" onclick={cancelSetup}>
          {$t('cancel')}
        </Button>
        <Button type="button" onclick={handleEnable} {loading} disabled={totpCode.length !== 6}>
          {$t('enable_two_factor_authentication')}
        </Button>
      </div>
    </div>
  {/if}

  {#if totpEnabled}
    <div class="flex flex-col gap-4">
      <Alert color="success" title={$t('two_factor_authentication_enabled')} />

      <div class="text-sm">
        {$t('totp_enabled_description')}
      </div>

      <form onsubmit={(e) => { e.preventDefault(); handleDisable(); }} class="flex flex-col gap-4">
        <Field label={$t('password')} required="indicator">
          <PasswordInput id="password" bind:value={password} autocomplete="current-password" />
        </Field>

        <Button type="submit" color="danger" size="large" {loading}>
          {$t('disable_two_factor_authentication')}
        </Button>
      </form>
    </div>
  {/if}
</Stack>
