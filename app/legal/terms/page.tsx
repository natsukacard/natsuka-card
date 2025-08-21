'use client';

import { Container, Divider, List, Stack, Text, Title } from '@mantine/core';

export default function TermsPage() {
  return (
    <Container py={50} size="sm">
      <Stack>
        <Title order={3} c="dark.4" ta="center" className="lowercase">
          Terms of Service
        </Title>
        <Text size="sm" c="dark.2" ta="center" className="lowercase">
          last updated: august 21, 2025
        </Text>

        <Text size="md" fw={600} c="dark.4" pt={10} className="lowercase">
          1. agreement to terms
        </Text>
        <Text size="sm" c="dark.4" className="lowercase">
          these terms of service ("terms") are a binding legal agreement between
          you and <span style={{ textTransform: 'none' }}>Pema Sherpa</span>,
          doing business as{' '}
          <span style={{ textTransform: 'none' }}>Natsuka</span> ("we," "us," or
          "our"), concerning your use of our website natsukacard.com (the
          "site") and any other related products and services we offer. by
          accessing the services, you confirm that you have read, understood,
          and agree to be bound by all of these terms. if you do not agree with
          all of these terms, then you are expressly prohibited from using the
          services and you must discontinue use immediately. we may make changes
          to these terms from time to time and will notify you of any material
          changes through a prominent banner on our site or other communication.
        </Text>
        <Divider my={10} />

        <Text size="md" fw={600} c="dark.4" className="lowercase">
          2. our services
        </Text>
        <Text size="sm" c="dark.4" className="lowercase">
          the information provided through the services is not intended for
          distribution in any jurisdiction where such distribution or use would
          be contrary to law or regulation. if you choose to access the services
          from such locations, you do so on your own initiative and are solely
          responsible for compliance with local laws.
        </Text>
        <Text size="sm" c="dark.4" className="lowercase">
          you acknowledge that our platform serves as a venue for users to list,
          sell, and buy products. as such, natsuka is not a party to any
          transaction between buyers and sellers. we do not manufacture, store,
          or inspect any of the items sold through our services. because all
          product descriptions are provided by the sellers, you agree that we
          are not responsible for and make no guarantees regarding their
          accuracy, quality, or legality.
        </Text>
        <Divider my={10} />

        <Text size="md" fw={600} c="dark.4" className="lowercase">
          3. intellectual property rights
        </Text>
        <Text size="sm" fw={600} c="dark.4" className="lowercase">
          3.1 our intellectual property
        </Text>
        <Text size="sm" c="dark.4" className="lowercase">
          we are the owner or licensee of all intellectual property rights in
          our services, including all source code, databases, functionality,
          software, website designs, audio, video, text, photographs, and
          graphics (the "content"), as well as the trademarks, service marks,
          and logos contained therein (the "marks"). our content and marks are
          provided through the services "as is" for your personal,
          non-commercial use only.
        </Text>
        <Text size="sm" fw={600} c="dark.4" className="lowercase">
          3.2 your use of our services
        </Text>
        <Text size="sm" c="dark.4" className="lowercase">
          subject to your compliance with these terms, we grant you a
          non-exclusive, non-transferable, revocable license to access the
          services and to download or print a copy of any portion of the content
          for your personal, non-commercial use. no part of the services,
          content, or marks may be copied, reproduced, sold, licensed, or
          otherwise exploited for any commercial purpose without our express
          prior written permission.
        </Text>
        <Text size="sm" fw={600} c="dark.4" className="lowercase">
          3.3 your submissions and contributions
        </Text>
        <Text size="sm" c="dark.4" className="lowercase">
          when you post or upload any content through the site, you grant us
          certain rights and have certain obligations.
        </Text>
        <List
          size="sm"
          withPadding
          c="dark.4"
          listStyleType="disc"
          className="lowercase"
          spacing="sm"
        >
          <List.Item>
            <strong>submissions.</strong> if you send us any question, comment,
            suggestion, or feedback ("submissions"), you agree to assign to us
            all intellectual property rights in such submission. we will own the
            submission and can use it for any lawful purpose without
            acknowledgment or compensation to you.
          </List.Item>
          <List.Item>
            <strong>contributions.</strong> we may allow you to create, submit,
            or post content, including text, videos, photos, comments, and
            reviews ("contributions").
          </List.Item>
          <List.Item>
            <strong>contribution license.</strong> by posting your
            contributions, you grant natsuka a worldwide, non-exclusive,
            royalty-free, sublicensable license to use, host, display,
            reproduce, and distribute your contributions{' '}
            <strong>
              solely for the purposes of operating, developing, providing, and
              promoting the services
            </strong>
            . this license includes our use of your name and any trademarks or
            logos you provide in connection with your contribution. you retain
            full ownership of your contributions.
          </List.Item>
          <List.Item>
            <strong>your responsibility.</strong> you are solely responsible for
            your contributions. you warrant that you own or have the necessary
            rights to your contributions and that they do not infringe on any
            third-party rights or violate any applicable laws. you agree to
            reimburse us for any losses we may suffer due to a breach of these
            warranties.
          </List.Item>
          <List.Item>
            <strong>content removal.</strong> we have no obligation to monitor
            contributions, but we reserve the right to remove or edit any
            contributions at any time without notice if we believe they violate
            these terms or are otherwise harmful.
          </List.Item>
        </List>
        <Text size="sm" fw={600} c="dark.4" className="lowercase">
          3.4 copyright infringement
        </Text>
        <Text size="sm" c="dark.4" className="lowercase">
          we respect the intellectual property rights of others. if you believe
          that any material on the services infringes upon a copyright you own
          or control, please refer to the{' '}
          <span style={{ textTransform: 'none' }}>
            "Digital Millennium Copyright Act (DMCA) Notice and Policy"
          </span>{' '}
          section below.
        </Text>
        <Divider my={10} />

        <Text size="md" fw={600} c="dark.4" className="lowercase">
          4. user representations
        </Text>
        <Text size="sm" c="dark.4" className="lowercase">
          by using the services, you represent and warrant that: (1) all
          registration information you submit is true, accurate, current, and
          complete; (2) you will maintain the accuracy of this information; (3)
          you have the legal capacity to agree to these terms; (4) you are at
          least 13 years of age; (5) if you are a minor, you have received
          parental permission to use the services; (6) you will not access the
          services through automated means like bots or scripts; (7) you will
          not use the services for any illegal purpose; and (8) your use of the
          services will not violate any applicable law.
        </Text>
        <Divider my={10} />

        <Text size="md" fw={600} c="dark.4" className="lowercase">
          5. user registration
        </Text>
        <Text size="sm" c="dark.4" className="lowercase">
          you may be required to register to use the services. you agree to keep
          your password confidential and are responsible for all activity on
          your account. we reserve the right to remove or change a username if
          we deem it inappropriate.
        </Text>
        <Divider my={10} />

        <Text size="md" fw={600} c="dark.4" className="lowercase">
          6. user listings and transactions
        </Text>
        <Text size="sm" c="dark.4" className="lowercase">
          users are responsible for the accuracy, quality, and legality of the
          items they list for sale on the services. we do not guarantee that the
          colors, features, specifications, or details of products will be
          accurate, complete, or reliable. all products are subject to
          availability as determined by the seller. we reserve the right to
          remove any listing at any time for any reason. prices are set by
          sellers and are subject to change.
        </Text>
        <Divider my={10} />

        <Text size="md" fw={600} c="dark.4" className="lowercase">
          7. purchases and payment
        </Text>
        <Text size="sm" c="dark.4" className="lowercase">
          we accept payments via{' '}
          <span style={{ textTransform: 'none' }}>Visa</span>,{' '}
          <span style={{ textTransform: 'none' }}>Mastercard</span>,{' '}
          <span style={{ textTransform: 'none' }}>American Express</span>,{' '}
          <span style={{ textTransform: 'none' }}>Discover</span>, and{' '}
          <span style={{ textTransform: 'none' }}>PayPal</span> through a
          third-party payment processor. you agree to provide current, complete,
          and accurate purchase and account information for all transactions.
          you authorize us to charge your chosen payment provider for all
          purchases you make. we are not responsible for any errors in pricing
          made by sellers. all payments shall be in{' '}
          <span style={{ textTransform: 'none' }}>US</span> dollars.
        </Text>
        <Divider my={10} />

        <Text size="md" fw={600} c="dark.4" className="lowercase">
          8. subscriptions
        </Text>
        <Text size="sm" c="dark.4" className="lowercase">
          if you purchase a subscription, it will automatically renew unless
          canceled. you can cancel your subscription at any time through your
          account settings. your cancellation will take effect at the end of the
          current paid term. we reserve the right to change subscription fees
          and will notify you of any price changes in accordance with applicable
          law.
        </Text>
        <Divider my={10} />

        <Text size="md" fw={600} c="dark.4" className="lowercase">
          9. return and refund policy
        </Text>
        <Text size="sm" c="dark.4" className="lowercase">
          natsuka is a platform for transactions between users. as such, we are
          not directly involved in the sale, purchase, or shipping of items. all
          returns, refunds, and transaction disputes are to be handled directly
          between the buyer and the seller according to their agreed-upon terms.
          natsuka does not offer refunds but may, at its discretion, assist in
          mediating disputes.
        </Text>
        <Divider my={10} />

        <Text size="md" fw={600} c="dark.4" className="lowercase">
          10. prohibited activities
        </Text>
        <Text size="sm" c="dark.4" className="lowercase">
          you may only use the services for their intended purpose. you agree
          not to:
        </Text>
        <List
          size="sm"
          withPadding
          c="dark.4"
          listStyleType="disc"
          className="lowercase"
        >
          <List.Item mb={4}>
            systematically retrieve data to create a collection or database
            without our permission.
          </List.Item>
          <List.Item mb={4}>
            trick, defraud, or mislead us or other users.
          </List.Item>
          <List.Item mb={4}>
            interfere with security-related features of the services.
          </List.Item>
          <List.Item mb={4}>
            disparage or harm natsuka or the services.
          </List.Item>
          <List.Item mb={4}>
            harass, abuse, or harm another person using information from the
            services.
          </List.Item>
          <List.Item mb={4}>
            upload viruses, spam, or other harmful material.
          </List.Item>
          <List.Item mb={4}>
            engage in any automated use of the system, like data mining or bots.
          </List.Item>
          <List.Item mb={4}>
            impersonate another user or use another user's account.
          </List.Item>
          <List.Item mb={4}>
            use the services to compete with us or for any commercial enterprise
            not approved by us.
          </List.Item>
          <List.Item>violate any applicable laws or regulations.</List.Item>
        </List>
        <Divider my={10} />

        <Text size="md" fw={600} c="dark.4" className="lowercase">
          11. social media
        </Text>
        <Text size="sm" c="dark.4" className="lowercase">
          you may link your natsuka account with third-party accounts (e.g.,
          google). by doing so, you permit us to access, store, and use content
          from your third-party account as allowed by that service and your
          privacy settings. your relationship with such third-party service
          providers is governed solely by your agreement with them.
        </Text>
        <Divider my={10} />

        <Text size="md" fw={600} c="dark.4" className="lowercase">
          12. third-party websites and content
        </Text>
        <Text size="sm" c="dark.4" className="lowercase">
          the services may contain links to other websites ("third-party
          websites") and content from third parties ("third-party content"). we
          are not responsible for and do not endorse any third-party websites or
          third-party content. if you choose to access them, you do so at your
          own risk, and these terms no longer apply.
        </Text>
        <Divider my={10} />

        <Text size="md" fw={600} c="dark.4" className="lowercase">
          13. advertisers
        </Text>
        <Text size="sm" c="dark.4" className="lowercase">
          we may allow advertisers to display their ads on the services. we only
          provide the space for such advertisements and have no other
          relationship with the advertisers.
        </Text>
        <Divider my={10} />

        <Text size="md" fw={600} c="dark.4" className="lowercase">
          14. services management
        </Text>
        <Text size="sm" c="dark.4" className="lowercase">
          we reserve the right, but not the obligation, to: (1) monitor the
          services for violations of these terms; (2) take appropriate legal
          action against violators; (3) refuse, restrict, or disable any user's
          contribution; and (4) manage the services in a manner designed to
          protect our rights and property and facilitate the proper functioning
          of the services.
        </Text>
        <Divider my={10} />

        <Text size="md" fw={600} c="dark.4" className="lowercase">
          15. privacy policy
        </Text>
        <Text size="sm" c="dark.4" className="lowercase">
          we care about data privacy and security. please review our privacy
          policy. by using the services, you agree to be bound by our privacy
          policy, which is incorporated into these terms. the services are
          hosted in the{' '}
          <span style={{ textTransform: 'none' }}>United States</span> and{' '}
          <span style={{ textTransform: 'none' }}>Japan</span>. by using the
          services, you consent to have your data transferred to and processed
          in these countries.
        </Text>
        <Divider my={10} />

        <Text size="md" fw={600} c="dark.4" className="lowercase">
          16. term and termination
        </Text>
        <Text size="sm" c="dark.4" className="lowercase">
          these terms remain in full force and effect while you use the
          services. we reserve the right to deny access to and use of the
          services to any person for any reason at our sole discretion. we may
          terminate your use of the services or delete your account at any time,
          without warning.
        </Text>
        <Divider my={10} />

        <Text size="md" fw={600} c="dark.4" className="lowercase">
          17. modifications and interruptions
        </Text>
        <Text size="sm" c="dark.4" className="lowercase">
          we reserve the right to change, modify, or remove the contents of the
          services at any time without notice. we cannot guarantee the services
          will be available at all times and may experience interruptions or
          delays. you agree that we have no liability for any loss, damage, or
          inconvenience caused by your inability to access or use the services
          during any downtime.
        </Text>
        <Divider my={10} />

        <Text size="md" fw={600} c="dark.4" className="lowercase">
          18. governing law
        </Text>
        <Text size="sm" c="dark.4" className="lowercase">
          these terms are governed by and construed in accordance with the laws
          of the state of{' '}
          <span style={{ textTransform: 'none' }}>California</span>, without
          regard to its conflict of law principles.
        </Text>
        <Divider my={10} />

        <Text size="md" fw={600} c="dark.4" className="lowercase">
          19. dispute resolution
        </Text>
        <Text size="sm" c="dark.4" className="lowercase">
          to resolve disputes quickly and cost-effectively, the parties agree to
          first attempt to negotiate any dispute informally for at least thirty
          (30) days. if informal negotiations are unsuccessful, the dispute will
          be resolved by binding arbitration under the rules of the{' '}
          <span style={{ textTransform: 'none' }}>
            American Arbitration Association ("AAA")
          </span>
          . you understand that without this provision, you would have the right
          to sue in court and have a jury trial.
        </Text>
        <Divider my={10} />

        <Text size="md" fw={600} c="dark.4" className="lowercase">
          20. disclaimer
        </Text>
        <Text size="sm" c="dark.4" className="lowercase">
          the services are provided on an as-is and as-available basis. you
          agree that your use of the services is at your sole risk. to the
          fullest extent permitted by law, we disclaim all warranties, express
          or implied, in connection with the services, including the implied
          warranties of merchantability, fitness for a particular purpose, and
          non-infringement.
        </Text>
        <Divider my={10} />

        <Text size="md" fw={600} c="dark.4" className="lowercase">
          21. limitations of liability
        </Text>
        <Text size="sm" c="dark.4" className="lowercase">
          in no event will we or our directors, employees, or agents be liable
          to you or any third party for any direct, indirect, consequential,
          exemplary, incidental, special, or punitive damages. our liability to
          you for any cause whatsoever will at all times be limited to the
          amount paid, if any, by you to us during the six (6) month period
          prior to any cause of action arising or $100.00{' '}
          <span style={{ textTransform: 'none' }}>USD</span>, whichever is less.
        </Text>
        <Divider my={10} />

        <Text size="md" fw={600} c="dark.4" className="lowercase">
          22. indemnification
        </Text>
        <Text size="sm" c="dark.4" className="lowercase">
          you agree to defend, indemnify, and hold us harmless from any loss,
          damage, liability, claim, or demand, including reasonable attorneys’
          fees, made by any third party due to or arising out of your use of the
          services, your contributions, or your breach of these terms.
        </Text>
        <Divider my={10} />

        <Text size="md" fw={600} c="dark.4" className="lowercase">
          23. user data
        </Text>
        <Text size="sm" c="dark.4" className="lowercase">
          we will maintain certain data that you transmit to the services for
          the purpose of managing the performance of the services. while we
          perform regular backups, you are solely responsible for all data you
          transmit. you agree that we shall have no liability to you for any
          loss or corruption of such data.
        </Text>
        <Divider my={10} />

        <Text size="md" fw={600} c="dark.4" className="lowercase">
          24. california users and residents
        </Text>
        <Text size="sm" c="dark.4" className="lowercase">
          if any complaint with us is not satisfactorily resolved, you can
          contact the complaint assistance unit of the division of consumer
          services of the{' '}
          <span style={{ textTransform: 'none' }}>
            California Department of Consumer Affairs
          </span>{' '}
          in writing at 1625 north market blvd., suite n 112, sacramento,
          california 95834 or by telephone at (800) 952-5210.
        </Text>
        <Divider my={10} />

        <Text size="md" fw={600} c="dark.4" className="lowercase">
          25. miscellaneous
        </Text>
        <Text size="sm" c="dark.4" className="lowercase">
          these terms and any policies posted by us on the services constitute
          the entire agreement between you and us. our failure to enforce any
          right or provision of these terms shall not operate as a waiver. if
          any provision of these terms is found to be unlawful or unenforceable,
          that provision is deemed severable and does not affect the validity of
          the remaining provisions.
        </Text>
        <Divider my={10} />

        <Text size="md" fw={600} c="dark.4" className="lowercase">
          26. contact us
        </Text>
        <Text size="sm" c="dark.4" className="lowercase">
          to resolve a complaint or receive further information regarding the
          use of the services, please contact us at:
        </Text>
        <Text size="sm" c="dark.4" mt="sm">
          <span style={{ textTransform: 'none' }}>Pema Sherpa</span>
          <br />
          3334 Molino
          <br />
          <span style={{ textTransform: 'none' }}>Irvine, CA 92618</span>
          <br />
          <span style={{ textTransform: 'none' }}>United States</span>
          <br />
          biz@natsukacard.com
        </Text>
      </Stack>
    </Container>
  );
}
