# Sharing

Immich supports local sharing, with users on the same Immich instance, and public sharing via public links.

## Local sharing

### Albums

Albums can be shared between users on the same Immich instance. The shared users can view and add their own photos and videos to the shared album.

After creating an album, you can access the sharing options by clicking on the share icon. When sharing an album, you can select the users you want to share the album with and assign them permissions either as editors (read-write) or viewers (read-only).

#### Web

<img src={require('./img/shared-album.webp').default} width='60%' title='Shared album option' caption='ok' />

<img src={require('./img/shared-album-user-selection.webp').default} width='30%' height='100%' title='Shared album user selection' />

#### Mobile App

<img src={require('./img/shared-album-mobile.webp').default} width='33%' title='Shared album option' />

### Partners

Partner sharing allows you to share your _entire_ library with other users of your choice. They can then view your library and download the assets.

You can read this guide to learn more about [partner sharing](/features/partner-sharing).

## Public sharing

You can create a public link to share a group of photos or videos, or an album, with anyone. The public link can be shared via email, social media, or any other method. There are a variety of options to customize the public link, such as setting an expiration date, password protection, and more. Public shared link is handy when you want to share a group of photos or videos with someone who doesn't have an Immich account and allow the shared user to upload their photos or videos to your account.

A public share link creates a restricted, unauthenticated session: whoever opens it can only view (and, if allowed, download or upload to) the assets or album that the link was created for, not any other part of your library.

The public shared link is generated with a random URL, which acts as as a secret to avoid the link being guessed by unwanted parties, for instance.

```
https://my.immich.app/share/JUckRMxlgpo7F9BpyqGk_cZEwDzaU_U5LU5_oNZp1ETIBa9dpQ0b5ghNm_22QVJfn3k
```

### Creating a public share link

You can create a public share link by selecting the photos or videos, or from the share icon on an album.

<img src={require('./img/public-shared-link-individual.webp').default} width='60%' title='Creating public shared link from selection' />

<img src={require('./img/public-shared-link-album.webp').default} width='30%' title='Creating public shared link from album' />

### Customizing the public share link

You can customize the public share link by setting an expiration date, password protection, allow what actions can be performed on the shared assets, and more.

<img src={require('./img/public-shared-link-form.webp').default} width='33%' title='Creating public shared link from album' />

### Using an alternative (custom) URL

Instead of the long, randomly generated URL, you can give an album (or individual asset) share link a custom, memorable "slug" in the **Custom URL** field of the share dialog. Once set, the link becomes:

```
https://my.immich.app/s/<your-custom-slug>
```

This alternative URL points to the exact same restricted session as the original link — visitors are still limited to viewing the assets from the album (or the selection) the link was created for — but it is easier to type, remember, and share than the default key-based URL. The custom slug can be changed, or removed, at any time from the share link's edit page, and it must be unique across the instance.
