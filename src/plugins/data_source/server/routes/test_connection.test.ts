/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import supertest from 'supertest';
import { UnwrapPromise } from '@osd/utility-types';
import { setupServer } from '../../../../../src/core/server/test_utils';

import {
  IAuthenticationMethodRegistery,
  authenticationMethodRegisteryMock,
} from '../auth_registry';
import { CustomApiSchemaRegistry } from '../schema_registry';
import { DataSourceServiceSetup } from '../../server/data_source_service';
import { CryptographyServiceSetup } from '../cryptography_service';
import { registerTestConnectionRoute } from './test_connection';
import { AuthType } from '../../common/data_sources';
// eslint-disable-next-line @osd/eslint/no-restricted-paths
import { opensearchClientMock } from '../../../../../src/core/server/opensearch/client/mocks';

type SetupServerReturn = UnwrapPromise<ReturnType<typeof setupServer>>;

const URL = '/internal/data-source-management/validate';

describe(`Test connection ${URL}`, () => {
  let server: SetupServerReturn['server'];
  let httpSetup: SetupServerReturn['httpSetup'];
  let handlerContext: SetupServerReturn['handlerContext'];
  let cryptographyMock: jest.Mocked<CryptographyServiceSetup>;
  const customApiSchemaRegistry = new CustomApiSchemaRegistry();
  let customApiSchemaRegistryPromise: Promise<CustomApiSchemaRegistry>;
  let dataSourceClient: ReturnType<typeof opensearchClientMock.createInternalClient>;
  let dataSourceServiceSetupMock: DataSourceServiceSetup;
  let authRegistryPromiseMock: Promise<IAuthenticationMethodRegistery>;
  const dataSourceAttr = {
    endpoint: 'https://test.com',
    auth: {
      type: AuthType.UsernamePasswordType,
      credentials: {
        username: 'testUser',
        password: 'testPassword',
      },
    },
  };

  beforeEach(async () => {
    ({ server, httpSetup, handlerContext } = await setupServer());
    customApiSchemaRegistryPromise = Promise.resolve(customApiSchemaRegistry);
    authRegistryPromiseMock = Promise.resolve(authenticationMethodRegisteryMock.create());
    dataSourceClient = opensearchClientMock.createInternalClient();

    dataSourceServiceSetupMock = {
      getDataSourceClient: jest.fn(() => Promise.resolve(dataSourceClient)),
      getDataSourceLegacyClient: jest.fn(),
    };

    const router = httpSetup.createRouter('');
    dataSourceClient.info.mockImplementationOnce(() =>
      opensearchClientMock.createSuccessTransportRequestPromise({ cluster_name: 'testCluster' })
    );
    registerTestConnectionRoute(
      router,
      dataSourceServiceSetupMock,
      cryptographyMock,
      authRegistryPromiseMock,
      customApiSchemaRegistryPromise
    );

    await server.start();
  });

  afterEach(async () => {
    await server.stop();
  });

  it('shows successful response', async () => {
    const result = await supertest(httpSetup.server.listener)
      .post(URL)
      .send({
        id: 'testId',
        dataSourceAttr,
      })
      .expect(200);
    expect(result.body).toEqual({ success: true });
    expect(dataSourceServiceSetupMock.getDataSourceClient).toHaveBeenCalledWith(
      expect.objectContaining({
        savedObjects: handlerContext.savedObjects.client,
        cryptography: cryptographyMock,
        dataSourceId: 'testId',
        testClientDataSourceAttr: dataSourceAttr,
        customApiSchemaRegistryPromise,
      })
    );
  });
});
