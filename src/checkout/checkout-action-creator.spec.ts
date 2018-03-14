import { createRequestSender } from '@bigcommerce/request-sender';
import { CartRequestSender } from '../cart';
import { CheckoutActionType } from './checkout-actions';
import { getCart } from '../cart/carts.mock';
import { getCheckout } from './checkouts.mock';
import { getErrorResponse, getResponse } from '../common/http-request/responses.mock';
import CheckoutActionCreator from './checkout-action-creator';
import createCheckoutClient from './create-checkout-client';
import 'rxjs/add/operator/toArray';
import 'rxjs/add/operator/toPromise';

describe('CheckoutActionCreator', () => {
    let checkoutClient;
    let cartRequestSender;

    beforeEach(() => {
        checkoutClient = createCheckoutClient();
        cartRequestSender = new CartRequestSender(createRequestSender());

        jest.spyOn(cartRequestSender, 'loadCarts')
            .mockReturnValue(Promise.resolve(getResponse([getCart()])));

        jest.spyOn(checkoutClient, 'loadCheckout')
            .mockReturnValue(Promise.resolve(getResponse(getCheckout())));
    });

    it('emits action to notify loading progress', async () => {
        const actionCreator = new CheckoutActionCreator(checkoutClient, cartRequestSender);
        const actions = await actionCreator.loadCheckout()
            .toArray()
            .toPromise();

        expect(actions).toEqual([
            { type: CheckoutActionType.LoadCheckoutRequested },
            { type: CheckoutActionType.LoadCheckoutSucceeded, payload: getCheckout() },
        ]);
    });

    it('emits error action if unable to load checkout', async () => {
        jest.spyOn(checkoutClient, 'loadCheckout')
            .mockReturnValue(Promise.reject(getErrorResponse()));

        const actionCreator = new CheckoutActionCreator(checkoutClient, cartRequestSender);

        try {
            const actions = await actionCreator.loadCheckout()
                .toArray()
                .toPromise();

            expect(actions).toEqual([
                { type: CheckoutActionType.LoadCheckoutRequested },
            ]);
        } catch (error) {
            expect(error).toEqual(
                { type: CheckoutActionType.LoadCheckoutFailed, error: true, payload: getErrorResponse() }
            );
        }
    });
});
