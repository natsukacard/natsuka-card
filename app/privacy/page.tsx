'use client';

import {
  Anchor,
  Container,
  Divider,
  List,
  Stack,
  Text,
  Title,
} from '@mantine/core';

export default function PrivacyPage() {
  return (
    <Container py={50} size="sm">
      <Stack>
        <Title order={3} c="dark.4" ta="center" className="lowercase">
          privacy policy
        </Title>
        <Text size="sm" c="dark.4" ta="center" className="lowercase">
          last updated: august 21, 2025
        </Text>
        <Text size="sm" c="dark.4" pt={10} className="lowercase">
          natsuka ("we", "us", "our", and "service") is committed to protecting
          your privacy. this privacy policy describes how we collect, use, and
          share your personal data when you use our website.
        </Text>

        <Text size="md" fw={600} c="dark.6" pt={10} className="lowercase">
          personal information we collect
        </Text>
        <Divider />
        <Text size="sm" c="dark.4" className="lowercase">
          <Text span fw={600} c="dark.6">
            account information.
          </Text>{' '}
          when you create an account, we collect the personal information you
          provide to us, such as your name, email address, username, and
          picture.
        </Text>
        <Text size="sm" c="dark.4" className="lowercase">
          <Text span fw={600} c="dark.6">
            third-party account information.
          </Text>{' '}
          you can create an account and log in to natsuka using third-party
          services like <span style={{ textTransform: 'none' }}>Google</span>.
          When you choose this option, the third-party service will provide us
          with certain information from your account, such as your name, email
          address, and profile picture. we use this information to create and
          manage your account and populate your profile. natsuka does not
          receive or store your password for these third-party services.
        </Text>
        <Text size="sm" c="dark.4" className="lowercase">
          <Text span fw={600} c="dark.6">
            payment information.
          </Text>{' '}
          where we sell products and services, we use third-party applications,
          such as <span style={{ textTransform: 'none' }}>Stripe</span> to
          process your payments. these third-party applications will collect
          information from you to process a payment on behalf of natsuka,
          including your name, email, address, mailing address, payment card
          information, and other billing information. natsuka does not receive
          or store your payment information, but it may receive and store
          information associated with your payment information (e.g., the fact
          that you have paid, the last four digits of your credit card, and your
          country of origin).
        </Text>
        <Text size="sm" c="dark.4" className="lowercase">
          <Text span fw={600} c="dark.6">
            communication information.
          </Text>{' '}
          we collect personal information from you such as email address, phone
          number, mailing address, and marketing preferences when you request
          information about natsuka, register for our newsletter, or otherwise
          communicate with us.
        </Text>
        <Text size="sm" c="dark.4" className="lowercase">
          <Text span fw={600} c="dark.6">
            usage information.
          </Text>{' '}
          we collect and analyze information about how our service, natsuka, is
          accessed, used, and performs. we refer to this as "usage data."
          examples of usage data include metadata, telemetry, and other
          technical information. while we may track usage statistics related to
          your content (like how often it is accessed), usage data never
          includes the content itself. in some cases, this data may include
          personal information, such as details about your interactions with
          other users.
        </Text>
        <Text size="sm" c="dark.4" className="lowercase">
          <Text span fw={600} c="dark.6">
            sweepstakes, contests, surveys and promotions information.
          </Text>{' '}
          when you participate in our sweepstakes, contests, surveys, or other
          promotions, you may provide us with information such as your name,
          email, and mailing address, along with any other details required for
          that specific event.
        </Text>

        <Text size="md" fw={600} pt={10} c="dark.6" className="lowercase">
          technical information
        </Text>
        <Divider />
        <Text size="sm" c="dark.4" className="lowercase">
          <Text span fw={600} c="dark.6">
            automatic data collection.
          </Text>{' '}
          as you use our services, we automatically gather technical information
          to ensure everything works correctly and to understand how our service
          is used. this includes details about your device and connection (like
          your ip address, browser, and operating system), as well as how you
          interact with the site, such as the pages you visit and the links you
          click. we also use standard identifiers, like cookies, to recognize
          you. additionally, with your specific permission, we may collect
          information about the fonts installed on your device to properly
          provide our services to you. we will not collect this font data
          without your consent.
        </Text>
        <Text size="sm" c="dark.4" className="lowercase">
          <Text span fw={600} c="dark.6">
            cookies and analytics.
          </Text>{' '}
          when you use our services, we and our third-party partners
          automatically collect information using technologies like{' '}
          <strong>cookies</strong>.
        </Text>
        <List size="sm" withPadding c="dark.4" listStyleType="disc">
          <List.Item mb={4}>
            <strong>cookies.</strong> these are small text files stored in your
            web browser that allows us to recognize your device and remember
            your preferences and settings.
          </List.Item>
          <List.Item>
            <strong>pixel tags (or web beacons).</strong> this is a tiny,
            invisible piece of code embedded on our pages or in our emails. it
            helps us understand user engagement by tracking if you have visited
            a specific page, clicked on an advertisement, or opened an email.
          </List.Item>
        </List>
        <Text size="sm" c="dark.4" className="lowercase">
          for analytics, we use services like{' '}
          <span style={{ textTransform: 'none' }}>Google</span> analytics to
          process information about your activity. you can learn more about{' '}
          <span style={{ textTransform: 'none' }}>Google</span>'s practices at{' '}
          <Anchor
            href="https://www.google.com/policies/privacy/partners/"
            target="_blank"
            inherit
          >
            https://www.google.com/policies/privacy/partners/
          </Anchor>
          . you also have the right to opt out of{' '}
          <span style={{ textTransform: 'none' }}>Google</span> analytics by
          visiting{' '}
          <Anchor
            href="https://tools.google.com/dlpage/gaoptout"
            target="_blank"
            inherit
          >
            https://tools.google.com/dlpage/gaoptout
          </Anchor>
          .
        </Text>

        <Text size="md" fw={600} pt={10} c="dark.6" className="lowercase">
          how we use your information
        </Text>
        <Divider />
        <Text size="sm" c="dark.4" className="lowercase">
          we use the information we collect for various purposes, including:
        </Text>
        <List size="sm" withPadding c="dark.4" listStyleType="disc">
          <List.Item mb={8}>
            <strong>to provide and maintain our service.</strong> including to
            monitor the usage of our service.
          </List.Item>
          <List.Item mb={8}>
            <strong>to manage your account.</strong> to manage your registration
            as a user of the service. the personal data you provide gives you
            access to the various functionalities available to you as a
            registered user.
          </List.Item>
          <List.Item mb={8}>
            <strong>for the performance of a contract.</strong> to develop,
            comply with, and undertake the purchase contract for products,
            items, or services you have purchased, or for any other contract
            with us through the service.
          </List.Item>
          <List.Item mb={8}>
            <strong>to contact you.</strong> to contact you by email, telephone,
            sms, or other electronic communications like push notifications
            regarding updates or information related to the functionalities,
            products, or services you have contracted.
          </List.Item>
          <List.Item mb={8}>
            <strong>to provide you with news and offers.</strong> to send you
            news, special offers, and general information about other goods,
            services, and events we offer that are similar to those you have
            already purchased or inquired about, unless you have opted out.
          </List.Item>
          <List.Item mb={8}>
            <strong>to manage your requests.</strong> to attend and manage your
            requests to us.
          </List.Item>
          <List.Item mb={8}>
            <strong>for business transfers.</strong> to evaluate or conduct a
            merger, divestiture, restructuring, or other sale or transfer of
            some or all of our assets. in such an event, your personal data may
            be among the assets transferred.
          </List.Item>
          <List.Item mb={8}>
            <strong>for other purposes.</strong> for other purposes such as data
            analysis, identifying usage trends, determining the effectiveness of
            our marketing campaigns, and to evaluate and improve our service,
            products, marketing, and your experience.
          </List.Item>
        </List>

        <Text size="md" fw={600} pt={10} c="dark.6" className="lowercase">
          how we share your information
        </Text>
        <Divider />
        <Text size="sm" c="dark.4" className="lowercase">
          we may share your personal information in the following situations:
        </Text>
        <List size="sm" withPadding c="dark.4" listStyleType="disc">
          <List.Item mb={8}>
            <strong>with service providers.</strong> to share information with
            third-party vendors who perform services on our behalf, such as
            monitoring and analyzing the use of our service.
          </List.Item>
          <List.Item mb={8}>
            <strong>for business transfers.</strong> in connection with, or
            during negotiations of, any merger, sale of company assets,
            financing, or acquisition of all or a portion of our business to
            another company.
          </List.Item>
          <List.Item mb={8}>
            <strong>with affiliates.</strong> with our affiliates, including our
            parent company, subsidiaries, or other companies under common
            control, all of whom we will require to honor this privacy policy.
          </List.Item>
          <List.Item mb={8}>
            <strong>with business partners.</strong> with our business partners
            to offer you certain products, services, or promotions.
          </List.Item>
          <List.Item mb={8}>
            <strong>with other users.</strong> when you share information or
            interact in public areas, your data (such as your name, profile, and
            activity) may be viewed by all users and publicly distributed.
          </List.Item>
          <List.Item mb={8}>
            <strong>with your consent.</strong> for any other purpose with your
            explicit consent.
          </List.Item>
        </List>

        <Text size="md" fw={600} pt={10} c="dark.6" className="lowercase">
          retention of your personal data
        </Text>
        <Divider />
        <Text size="sm" c="dark.4" className="lowercase">
          natsuka will retain your personal data only for as long as is
          necessary for the purposes set out in this{' '}
          <span style={{ textTransform: 'none' }}>Privacy Policy</span>. we will
          retain and use your personal data to the extent necessary to comply
          with our legal obligations (for example, if we are required to retain
          your data to comply with applicable laws), resolve disputes, and
          enforce our legal agreements and policies.
        </Text>
        <Text size="sm" c="dark.4" className="lowercase">
          we will also retain usage data for internal analysis purposes. usage
          data is generally retained for a shorter period, except when this data
          is used to strengthen the security or to improve the functionality of
          our service, or when we are legally obligated to retain it for longer
          time periods.
        </Text>

        <Text size="md" fw={600} pt={10} c="dark.6" className="lowercase">
          transfer of your personal data
        </Text>
        <Divider />
        <Text size="sm" c="dark.4" className="lowercase">
          your information, including personal data, is processed at natsuka's
          operating offices and may be stored on servers in other locations.
          this means your information may be transferred to and maintained on
          computers located outside of your state, province, or country, where
          data protection laws may differ from those in your jurisdiction.
        </Text>
        <Text size="sm" c="dark.4" className="lowercase">
          by providing us with your information and consenting to this{' '}
          <span style={{ textTransform: 'none' }}>Privacy Policy</span>, you
          agree to this transfer.
        </Text>
        <Text size="sm" c="dark.4" className="lowercase">
          we will take all steps reasonably necessary to ensure your data is
          treated securely and in accordance with this{' '}
          <span style={{ textTransform: 'none' }}>Privacy Policy</span>. we will
          not transfer your personal data to an organization or a country unless
          we have confirmed that there are adequate controls in place to protect
          your data and other personal information.
        </Text>

        <Text size="md" fw={600} pt={10} c="dark.6" className="lowercase">
          your data rights and choices
        </Text>
        <Divider />
        <Text size="sm" c="dark.4" className="lowercase">
          you have the right to access, update, or request the deletion of your
          personal data. you can manage your information directly at any time by
          logging into your account and visiting your settings page.
          additionally, you may contact us to request access to, correction of,
          or deletion of any personal information that you have provided. please
          note, however, that we may need to retain certain information when we
          have a legal obligation or another lawful basis to do so.
        </Text>

        <Text size="md" fw={600} pt={10} c="dark.6" className="lowercase">
          your california privacy rights
        </Text>
        <Divider />
        <Text size="sm" c="dark.4" className="lowercase">
          if you are a resident of{' '}
          <span style={{ textTransform: 'none' }}>California</span>, you have
          specific rights regarding your personal information under the{' '}
          <span style={{ textTransform: 'none' }}>California</span> Consumer
          Privacy Act (<span style={{ textTransform: 'none' }}>CCPA</span>) and{' '}
          <span style={{ textTransform: 'none' }}>California</span> Privacy
          Rights Act (<span style={{ textTransform: 'none' }}>CPRA</span>).
          these rights include:
        </Text>
        <List size="sm" withPadding c="dark.4" listStyleType="disc">
          <List.Item mb={8}>
            the right to know what personal information is being collected,
            used, and shared.
          </List.Item>
          <List.Item mb={8}>
            the right to delete personal information.
          </List.Item>
          <List.Item mb={8}>
            the right to correct inaccurate personal information.
          </List.Item>
          <List.Item mb={8}>
            the right to opt-out of the sale or sharing of your personal
            information.
          </List.Item>
          <List.Item mb={8}>
            the right to limit the use and disclosure of sensitive personal
            information.
          </List.Item>
          <List.Item mb={8}>
            the right to non-discrimination for exercising your rights.
          </List.Item>
        </List>
        <Text size="sm" c="dark.4" className="lowercase">
          to exercise any of these rights, please contact us through the methods
          described in the "contact us" section.
        </Text>

        <Text size="md" fw={600} pt={10} c="dark.6" className="lowercase">
          disclosure of your personal data
        </Text>
        <Divider />
        <Text size="sm" c="dark.4" className="lowercase">
          <Text span fw={600} c="dark.6">
            business transactions.
          </Text>{' '}
          if natsuka is involved in a merger, acquisition, or asset sale, your
          personal data may be transferred. we will provide notice before your
          information is transferred and becomes subject to a different{' '}
          <span style={{ textTransform: 'none' }}>Privacy Policy</span>.
        </Text>
        <Text size="sm" c="dark.4" className="lowercase">
          <Text span fw={600} c="dark.6">
            law enforcement.
          </Text>{' '}
          we may be required to disclose your personal data if compelled by law
          or in response to valid requests from public authorities, such as a
          court or government agency.
        </Text>
        <Text size="sm" c="dark.4" className="lowercase">
          <Text span fw={600} c="dark.6">
            other legal requirements.
          </Text>{' '}
          we may disclose your personal data in the good faith belief that such
          action is necessary to:
        </Text>
        <List
          size="sm"
          withPadding
          c="dark.4"
          listStyleType="disc"
          className="lowercase"
          spacing={4}
        >
          <List.Item>comply with a legal obligation.</List.Item>
          <List.Item>
            protect and defend the rights or property of natsuka.
          </List.Item>
          <List.Item>
            prevent or investigate possible wrongdoing in connection with the
            service.
          </List.Item>
          <List.Item>
            protect the personal safety of users of the service or the public.
          </List.Item>
          <List.Item>protect against legal liability.</List.Item>
        </List>

        <Text size="md" fw={600} pt={10} c="dark.6" className="lowercase">
          children's privacy
        </Text>
        <Divider />
        <Text size="sm" c="dark.4" className="lowercase">
          our service is not intended for anyone under the age of 13, and we do
          not knowingly collect personally identifiable information from
          children. if you are a parent or guardian and believe your child has
          provided us with personal data, please contact us. if we learn that we
          have collected data from a child under 13 without verified parental
          consent, we will take steps to remove it from our servers. in
          jurisdictions where parental consent is required as a legal basis for
          data processing, we will obtain such consent before collecting and
          using that information.
        </Text>

        <Text size="md" fw={600} pt={10} c="dark.6" className="lowercase">
          changes to this privacy policy
        </Text>
        <Divider />
        <Text size="sm" c="dark.4" className="lowercase">
          we may update this{' '}
          <span style={{ textTransform: 'none' }}>Privacy Policy</span> from
          time to time. we will notify you of any changes by posting the new{' '}
          <span style={{ textTransform: 'none' }}>Privacy Policy</span> on this
          page and updating the "last updated" date at the top. you are advised
          to review this{' '}
          <span style={{ textTransform: 'none' }}>Privacy Policy</span>{' '}
          periodically for any changes.
        </Text>

        <Text size="md" fw={600} pt={10} c="dark.6" className="lowercase">
          contact us
        </Text>
        <Divider />
        <Text size="sm" c="dark.4" className="lowercase">
          if you have any questions about this{' '}
          <span style={{ textTransform: 'none' }}>Privacy Policy</span>, you can
          contact us via our{' '}
          <Anchor href="/contact" target="_blank" inherit>
            contact form
          </Anchor>
          .
        </Text>
      </Stack>
    </Container>
  );
}
